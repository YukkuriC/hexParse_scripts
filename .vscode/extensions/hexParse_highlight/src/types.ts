// 生成于 GLM-5V-Turbo
import { CompletionItemKind, DiagnosticSeverity, MarkupContent } from 'vscode-languageserver/node'

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
 * Hover 回调返回：i18n key、完整 hover 内容对象（`{kind, value}`，跳过 `{value}` 注入），或 null。
 * 返回 null 表示该条目不适用，跳出匹配。
 */
export type HoverResult = string | MarkupContent | null

/**
 * Hover 条目值：i18n key，或回调。
 * 回调接收匹配命中后的后缀（匹配之后的剩余部分），返回 `HoverResult`。
 */
export type HoverValue = string | ((suffix: string) => HoverResult)

/**
 * Hover 条目声明：`[触发前缀(区分大小写), HoverValue]` 元组数组，
 * 或 `{ 前缀: HoverValue }` 对象。
 * 两种形式均按声明（对象按键插入）顺序匹配，命中即返回；顺序即优先级，允许同名/覆盖。
 */
export type HoverEntry = [string, HoverValue][] | Record<string, HoverValue>

/**
 * 正则 Hover 条目数组：`[正则(默认区分大小写), HoverValue]`。
 * 后缀由命名捕获组 `(?<suffix>...)` 提供；缺失时退回整组 `m[0]`。
 */
export type HoverRegex = [RegExp, HoverValue][]

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
    /** Hover entries: ordered `[prefix, value]` pairs (case-sensitive prefix match) */
    hovers: HoverEntry
    /** Regex hover entries: ordered `[RegExp, value]` pairs (case-sensitive by default) */
    hoversRegex?: HoverRegex
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
