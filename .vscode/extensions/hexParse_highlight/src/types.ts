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

/**
 * Hover 条目值：i18n key，或回调。
 * 回调接收匹配命中后的后缀（key 前缀之后的剩余部分，小写），返回 i18n key
 * （随后按后缀注入 `{value}`）或 null。返回 null 表示该条目不适用，跳出匹配。
 */
export type HoverValue = string | ((suffix: string) => string | null)

export interface HoverEntry {
    [key: string]: HoverValue
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
