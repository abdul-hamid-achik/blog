/**
 * Lightweight content moderation for chat input.
 *
 * This is a first-pass, server-side filter. It catches obvious abuse
 * (slurs, threats, PII phishing) before the message ever reaches the LLM.
 * It is NOT a replacement for LLM-level safety -- the system prompt still
 * needs its own guardrails -- but it saves API cost on garbage input and
 * provides structured signals for the abuse-escalation pipeline.
 */

export enum ModerationResult {
  PASS = "pass",
  WARN = "warn", // borderline -- let through but flag for review
  SUPPORT = "support", // respond with crisis-support resources without calling the model
  BLOCK = "block", // reject outright
}

interface ModerationOutput {
  result: ModerationResult;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Pattern lists
// ---------------------------------------------------------------------------

// Obvious prompt injection attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|prompts?|rules?|directives?)/i,
  /disregard\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a|an|the)\s+/i,
  /new\s+instructions?:\s*/i,
  /system\s*prompt\s*:/i,
  /\bDAN\b.*\bmode\b/i,
  /pretend\s+you\s+(are|have)\s+no\s+(restrictions?|rules?|limits?|guidelines?)/i,
  /act\s+as\s+if\s+you\s+have\s+no\s+(restrictions?|rules?|filters?)/i,
  /bypass\s+(your\s+)?(safety|content|moderation)\s*(filters?|rules?|guidelines?)/i,
  /jailbreak/i,
  /ignora\s+(todas\s+)?(las\s+)?(instrucciones|reglas|directrices)\s+(anteriores|previas)/i,
  /ahora\s+eres\s+(un|una|el|la)\s+/i,
  /nuevas\s+instrucciones\s*:/i,
  /(?:prompt|mensaje)\s+del\s+sistema\s*:/i,
  /finge\s+que\s+no\s+tienes\s+(restricciones|reglas|límites|limites)/i,
  /(?:omite|evita|elude)\s+(?:los?\s+)?(?:filtros?\s+de\s+)?(?:seguridad|moderación|moderacion)/i,
  /игнорируй\s+(?:все\s+)?(?:предыдущие|прежние)\s+(?:инструкции|правила)/i,
  /теперь\s+ты\s+/i,
  /новые\s+инструкции\s*:/i,
  /системн(?:ый|ого)\s+промпт\s*:/i,
  /притворись,?\s+что\s+у\s+тебя\s+нет\s+(?:ограничений|правил)/i,
  /обойди\s+(?:фильтры\s+)?(?:безопасности|модерации)/i,
];

// Direct threats of violence are rejected before generation.
const VIOLENCE_PATTERNS = [
  /\bi('?m| am| will)\s+(going\s+to\s+)?kill\b/i,
  /\bkill\s+(them|him|her)\b/i,
  /(?:voy|vamos)\s+a\s+matar/iu,
  /(?:mataré|matare|matarlo|matarla|matarlos|matarlas)/iu,
  /(?:я\s+убью|хочу\s+убить|собираюсь\s+убить)/iu,
  /(?:угроза\s+взрыва|устроить\s+стрельбу)/iu,
  /\bbomb\s+threat\b/i,
  /\bshoot\s+up\b/i,
  /\bswatt?(ing)?\b/i,
];

// Self-harm language receives an immediate localized support response.
const SELF_HARM_PATTERNS = [
  /\bkill\s+(yourself|urself|myself)\b/i,
  /\bI\s+want\s+to\s+die\b/i,
  /\bsuicid(e|al)\b/i,
  /\b(?:quiero\s+morir|quiero\s+matarme|matarme|suicid(?:io|arme)|quitarme\s+la\s+vida|hacerme\s+daño)\b/i,
  /(?:я\s+хочу\s+умереть|хочу\s+умереть|убить\s+себя|самоубийств\p{L}*|покончить\s+с\s+собой|навредить\s+себе)/iu,
];

// PII phishing -- someone trying to get the chatbot to reveal or process sensitive data
const PII_PHISHING_PATTERNS = [
  /\b(credit\s*card|social\s*security|ssn|bank\s*account)\s*(number|#|no\.?)?\b/i,
  /\bwhat('?s| is)\s+(your|the)\s*(api|secret|openai|password|token)\s*(key)?\b/i,
  /\b(?:show|tell)\s+me\s+(?:your|the)\s+(?:api|secret|openai|password|token)\s*(?:key)?\b/i,
  /\bshow\s+me\s+(the\s+)?(env|environment|\.env|secret|api\s*key)/i,
  /\b(reveal|leak|output|print|display)\s+(your\s+)?(system\s*prompt|instructions?)/i,
  /\b(?:tarjeta\s+de\s+crédito|tarjeta\s+de\s+credito|seguro\s+social|cuenta\s+bancaria)\b/i,
  /\b(?:muestra|revela|imprime)\s+(?:tu\s+|el\s+|la\s+)?(?:\.env|clave\s+api|contraseña|prompt\s+del\s+sistema|instrucciones)\b/i,
  /(?:номер\s+кредитной\s+карты|банковск\p{L}*\s+сч[её]т|пароль|api[- ]?ключ)/iu,
  /(?:покажи|раскрой|выведи)\s+(?:мне\s+)?(?:свой\s+)?(?:\.env|системн\p{L}*\s+промпт|секрет|api[- ]?ключ)/iu,
];

// Excessive repetition (flood / annoyance)
const REPETITION_THRESHOLD = 5; // same word repeated 5+ times in a row

function hasExcessiveRepetition(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  let count = 1;
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1] && words[i].length > 1) {
      count++;
      if (count >= REPETITION_THRESHOLD) return true;
    } else {
      count = 1;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main moderation function
// ---------------------------------------------------------------------------

export function moderateInput(message: string): ModerationOutput {
  const trimmed = message.trim();

  // Empty after trim
  if (!trimmed) {
    return { result: ModerationResult.BLOCK, reason: "empty_message" };
  }

  // Prompt injection attempts -- block
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { result: ModerationResult.BLOCK, reason: "prompt_injection" };
    }
  }

  // Self-harm language gets help without spending tokens or exposing it to a model.
  for (const pattern of SELF_HARM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { result: ModerationResult.SUPPORT, reason: "self_harm" };
    }
  }

  // Direct threats -- block and flag.
  for (const pattern of VIOLENCE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { result: ModerationResult.BLOCK, reason: "violence_threat" };
    }
  }

  // PII phishing -- block
  for (const pattern of PII_PHISHING_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { result: ModerationResult.BLOCK, reason: "pii_phishing" };
    }
  }

  // Repetition spam
  if (hasExcessiveRepetition(trimmed)) {
    return { result: ModerationResult.BLOCK, reason: "repetition_spam" };
  }

  // All-caps shouting (only for messages longer than 20 chars to avoid false positives)
  if (
    trimmed.length > 20 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-Z]/.test(trimmed)
  ) {
    return { result: ModerationResult.WARN, reason: "all_caps" };
  }

  return { result: ModerationResult.PASS };
}
