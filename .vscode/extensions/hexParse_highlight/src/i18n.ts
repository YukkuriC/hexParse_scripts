// 生成于 GLM-5V-Turbo
// Lightweight i18n module for Language Server side
// VSCode's vscode.l10n is only available in extension host, not in LSP server process

/** Loaded locale bundle */
let bundle: Record<string, string> = {}
/** Current locale identifier */
let currentLocale = 'en'

const bundles: Record<string, Record<string, string>> = {}

/**
 * Register a locale bundle. Call during initialization.
 */
export function registerBundle(locale: string, strings: Record<string, string>): void {
    bundles[locale] = strings
}

/**
 * Set active locale and load corresponding bundle.
 * Falls back to 'en' if locale not found.
 */
export function setLocale(locale: string): void {
    currentLocale = locale
    bundle = bundles[locale] ?? bundles['en'] ?? {}
}

/**
 * Translate a key, with optional placeholder substitution.
 * Placeholders are in {name} format.
 *
 * @example t('hello', { name: 'World' }) => 'Hello World'
 */
export function t(key: string, params?: Record<string, string | number>): string {
    let text = bundle[key] ?? bundles['en']?.[key] ?? key
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, String(v))
        }
    }
    return text
}

/** Get current locale identifier */
export function getLocale(): string {
    return currentLocale
}
