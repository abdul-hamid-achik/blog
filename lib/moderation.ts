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
    PASS = 'pass',
    WARN = 'warn',   // borderline -- let through but flag for review
    BLOCK = 'block',  // reject outright
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
];

// Threats of violence or self-harm
const THREAT_PATTERNS = [
    /\bi('?m| am| will)\s+(going\s+to\s+)?kill\b/i,
    /\bkill\s+(yourself|urself|myself|them|him|her)\b/i,
    /\bI\s+want\s+to\s+die\b/i,
    /\bsuicid(e|al)\b/i,
    /\bbomb\s+threat\b/i,
    /\bshoot\s+up\b/i,
    /\bswatt?(ing)?\b/i,
];

// PII phishing -- someone trying to get the chatbot to reveal or process sensitive data
const PII_PHISHING_PATTERNS = [
    /\b(credit\s*card|social\s*security|ssn|bank\s*account)\s*(number|#|no\.?)?\b/i,
    /\bwhat('?s| is)\s+(your|the)\s*(api|secret|openai|password|token)\s*(key)?\b/i,
    /\bshow\s+me\s+(the\s+)?(env|environment|\.env|secret|api\s*key)/i,
    /\b(reveal|leak|output|print|display)\s+(your\s+)?(system\s*prompt|instructions?)/i,
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
        return { result: ModerationResult.BLOCK, reason: 'empty_message' };
    }

    // Prompt injection attempts -- block
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(trimmed)) {
            return { result: ModerationResult.BLOCK, reason: 'prompt_injection' };
        }
    }

    // Threats -- block and this should be flagged
    for (const pattern of THREAT_PATTERNS) {
        if (pattern.test(trimmed)) {
            return { result: ModerationResult.BLOCK, reason: 'threat_or_self_harm' };
        }
    }

    // PII phishing -- block
    for (const pattern of PII_PHISHING_PATTERNS) {
        if (pattern.test(trimmed)) {
            return { result: ModerationResult.BLOCK, reason: 'pii_phishing' };
        }
    }

    // Repetition spam
    if (hasExcessiveRepetition(trimmed)) {
        return { result: ModerationResult.BLOCK, reason: 'repetition_spam' };
    }

    // All-caps shouting (only for messages longer than 20 chars to avoid false positives)
    if (trimmed.length > 20 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
        return { result: ModerationResult.WARN, reason: 'all_caps' };
    }

    return { result: ModerationResult.PASS };
}
