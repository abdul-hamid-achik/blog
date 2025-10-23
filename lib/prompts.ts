import { ContentType, getContent, Locale, Prompts } from '@/lib/data';
import { allPrompts } from 'content-collections';

/**
 * Load all prompts from content collections
 */
function loadPrompts(): Prompts {
    return allPrompts;
}

/**
 * Get a specific prompt by type and locale
 */
export function getPrompt(promptType: string, locale: Locale): string {
    try {
        const prompts = loadPrompts();
        const prompt = prompts.find(p =>
            p.promptType === promptType && p.locale === locale
        );

        if (!prompt) {
            console.warn(`Prompt not found: ${promptType} for locale ${locale}`);
            return '';
        }

        const content = prompt.content || '';
        if (!content) {
            console.warn(`Prompt content is empty for ${promptType} (${locale})`);
        }

        return content;
    } catch (error) {
        console.error(`Error loading prompt ${promptType} for locale ${locale}:`, error);
        return '';
    }
}

/**
 * Fill prompt parameters with actual values
 */
export function fillPromptParameters(
    promptText: string,
    params: Record<string, string>
): string {
    let result = promptText;

    Object.entries(params).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, value);
    });

    return result;
}

/**
 * Get a prompt with parameters filled
 */
export function getPromptWithParams(
    promptType: string,
    locale: Locale,
    params: Record<string, string> = {}
): string {
    try {
        const promptTemplate = getPrompt(promptType, locale);
        if (!promptTemplate) {
            console.warn(`Empty prompt template for ${promptType} (${locale})`);
            return '';
        }
        return fillPromptParameters(promptTemplate, params);
    } catch (error) {
        console.error(`Error getting prompt with params ${promptType} (${locale}):`, error);
        return '';
    }
}

/**
 * Get all available prompts (for debugging)
 */
export function getAllPrompts(): Prompts {
    return loadPrompts();
}

/**
 * Get available prompt types for a locale
 */
export function getAvailablePromptTypes(locale: Locale): string[] {
    const prompts = loadPrompts();
    const types = prompts
        .filter(p => p.locale === locale)
        .map(p => p.promptType);

    return [...new Set(types)]; // Remove duplicates
}


/**
 * Get default parameters for prompts
 */
export function getDefaultPromptParams(): Record<string, string> {
    return {
        authorName: 'Abdul Hamid',
        authorLocation: 'Guadalajara, Mexico',
        authorInterests: 'psychoanalysis, authors like Jacques Lacan and Fyodor Dostoyevsky'
    };
}
