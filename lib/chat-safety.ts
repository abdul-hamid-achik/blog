import { Locale } from "./types";

const CRISIS_SUPPORT_COPY = {
  [Locale.EN]:
    "I’m really sorry you’re carrying this right now. If you might act on these thoughts or are in immediate danger, call your local emergency services now. In the United States and its territories, call or text **988** or use [988 Lifeline chat](https://988lifeline.org). Elsewhere, [Find A Helpline](https://findahelpline.com) lists verified support by country. If you can, move away from anything you could use to hurt yourself and contact someone you trust who can stay with you. **Are you in immediate danger right now?**",
  [Locale.ES]:
    "Siento mucho que estés pasando por esto. Si crees que podrías actuar ahora o estás en peligro inmediato, llama a los servicios de emergencia de tu país. En Estados Unidos y sus territorios, llama al **988** y pulsa 2, envía **AYUDA** al 988 o usa el [chat de 988 Lifeline](https://988lifeline.org). En otros países, [Find A Helpline](https://findahelpline.com) ofrece recursos verificados por país. Si puedes, aléjate de cualquier cosa con la que pudieras hacerte daño y contacta a una persona de confianza que pueda acompañarte. **¿Estás en peligro inmediato ahora mismo?**",
  [Locale.RU]:
    "Мне очень жаль, что вам сейчас приходится через это проходить. Если вы можете причинить себе вред прямо сейчас или находитесь в непосредственной опасности, немедленно позвоните в местную экстренную службу. В США и их территориях можно позвонить или написать по номеру **988** либо воспользоваться [чатом 988 Lifeline](https://988lifeline.org). В других странах [Find A Helpline](https://findahelpline.com) помогает найти проверенную поддержку по стране. Если можете, отойдите от всего, чем можно причинить себе вред, и свяжитесь с человеком, которому доверяете и который сможет побыть рядом. **Вы сейчас в непосредственной опасности?**",
} satisfies Record<Locale, string>;

const MODERATION_BLOCK_COPY = {
  [Locale.EN]:
    "I can’t process that request. Please rephrase it without instructions to bypass safeguards, expose private data, or threaten someone.",
  [Locale.ES]:
    "No puedo procesar esa solicitud. Reformúlala sin instrucciones para eludir protecciones, exponer datos privados o amenazar a alguien.",
  [Locale.RU]:
    "Я не могу обработать этот запрос. Переформулируйте его без попыток обойти защиту, раскрыть личные данные или угрожать кому-либо.",
} satisfies Record<Locale, string>;

export function getCrisisSupportMessage(locale: Locale): string {
  return CRISIS_SUPPORT_COPY[locale];
}

export function getModerationBlockMessage(locale: Locale): string {
  return MODERATION_BLOCK_COPY[locale];
}
