// 生成于 GLM-5V-Turbo
import { CompletionItemKind, DiagnosticSeverity } from 'vscode-languageserver/node'

export interface Entry {
    label: string
    kind: CompletionItemKind
    detail?: string
    documentation?: string
    insertText?: string
}

export interface PrefixEntry {
    prefix: string
    entries: Entry[]
}

export interface HoverEntry {
    [key: string]: string
}

// ─── Plugin Registration Interface ────────────────────────────

/**
 * Extracts the display value from the token suffix after a prefix match.
 * Called with the text after the prefix (e.g. "114514" for "num_114514").
 * Returns the formatted value string to be injected as `{value}` in hover i18n.
 */
export type ValueExtractor = (suffix: string) => string

/**
 * Validates a single token text.
 * Returns a diagnostic entry if invalid, or null if valid.
 */
export interface TokenValidator {
    /** Test whether this validator applies to the given token text */
    test(tokenText: string): boolean
    /** Produce an error message i18n key + params; return null if valid */
    validate(tokenText: string): { key: string; params: Record<string, string | number> } | null
    severity?: DiagnosticSeverity
}

/**
 * Complete plugin definition. Each plugin module exports one of these.
 * The framework aggregates all plugins and dispatches hover/validation/completion through them.
 */
export interface PluginDef {
    /** Human-readable name for debugging / logging */
    name: string

    // ── Completion ──
    /** Prefix-based completion entries */
    prefixes: PrefixEntry[]

    // ── Hover ──
    /** Hover entries: token prefix → i18n key (resolved at display time) */
    hovers: HoverEntry
    /**
     * Value extractors for prefix hovers that need special formatting.
     * Key = hover prefix (must match a key in `hovers`),
     * Value = function that transforms the raw suffix into a display string.
     * Prefixes not listed here get their raw suffix passed as `{value}` directly.
     */
    valueExtractors?: Record<string, ValueExtractor>
    /**
     * Default values when suffix is empty (e.g. num_ with no number → "0").
     * Key = hover prefix, Value = default string to use when suffix === "".
     */
    emptyDefaults?: Record<string, string>

    // ── Validation ──
    /** Token-level validation rules registered by this plugin */
    validators?: TokenValidator[]
}
