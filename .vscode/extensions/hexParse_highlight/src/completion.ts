// 生成于 GLM-5V-Turbo
import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver/node'
import { Entry, PrefixEntry } from './types'
import { allPluginPrefixes } from './plugins'
import { tr } from './i18n'
import { getPatternIndex, pickPatternName, patternLangKey, PatternEntry, getPatternImage, formatPatternEntryText } from './patternIndex'
import { Token } from './tokenizer'

// ─── Core Completion Data (Hexcasting built-in) ──────────────
// detail/documentation store i18n keys; resolved by t() at consumption time

export const DIALECTS: Entry[] = [
    {
        label: 'thoth',
        kind: CompletionItemKind.Keyword,
        detail: 'completion.dialect.detail',
        documentation: 'completion.thoth.doc',
    },
    {
        label: 'iris',
        kind: CompletionItemKind.Keyword,
        detail: 'completion.dialect.detail',
        documentation: 'completion.iris.doc',
    },
    {
        label: 'hermes',
        kind: CompletionItemKind.Keyword,
        detail: 'completion.dialect.detail',
        documentation: 'completion.hermes.doc',
    },
]

export const META_PATTERNS: Entry[] = [
    {
        label: 'if',
        kind: CompletionItemKind.Keyword,
        detail: 'completion.meta.detail',
        documentation: 'completion.if.doc',
    },
    {
        label: 'eval',
        kind: CompletionItemKind.Keyword,
        detail: 'completion.meta.detail',
        documentation: 'completion.eval.doc',
    },
    {
        label: 'eval/cc',
        kind: CompletionItemKind.Keyword,
        detail: 'completion.meta.detail',
        documentation: 'completion.evalcc.doc',
    },
    {
        label: 'for_each',
        kind: CompletionItemKind.Keyword,
        detail: 'completion.meta.detail',
        documentation: 'completion.foreach.doc',
    },
    {
        label: 'halt',
        kind: CompletionItemKind.Keyword,
        detail: 'completion.meta.detail',
        documentation: 'completion.halt.doc',
    },
    {
        label: 'del',
        kind: CompletionItemKind.Keyword,
        detail: 'completion.meta.detail',
        documentation: 'completion.del.doc',
    },
]

export const CONSTANTS: Entry[] = [
    {
        label: 'true',
        kind: CompletionItemKind.Constant,
        detail: 'completion.boolean.detail',
        documentation: 'completion.true.doc',
    },
    {
        label: 'false',
        kind: CompletionItemKind.Constant,
        detail: 'completion.boolean.detail',
        documentation: 'completion.false.doc',
    },
    {
        label: 'null',
        kind: CompletionItemKind.Constant,
        detail: 'completion.null.detail',
        documentation: 'completion.null.doc',
    },
    {
        label: 'NULL',
        kind: CompletionItemKind.Constant,
        detail: 'completion.nullLabel.detail',
        documentation: 'completion.nullLabel.doc',
    },
    {
        label: 'garbage',
        kind: CompletionItemKind.Constant,
        detail: 'completion.garbage.detail',
        documentation: 'completion.garbage.doc',
    },
]

export const ENTITY_REFS: Entry[] = [
    {
        label: 'self',
        kind: CompletionItemKind.Variable,
        detail: 'completion.entity.detail',
        documentation: 'completion.self.doc',
    },
    {
        label: 'myself',
        kind: CompletionItemKind.Variable,
        detail: 'completion.entity.detail',
        documentation: 'completion.myself.doc',
    },
    {
        label: 'entity_',
        kind: CompletionItemKind.Variable,
        detail: 'completion.entityUuid.detail',
        documentation: 'completion.entityUuid.doc',
        insertText: 'entity_${1:00000000-0000-0000-0000-000000000000}',
    },
]

/** Core (non-plugin) prefix entries */
const corePrefixes: PrefixEntry[] = [
    {
        prefix: 'num_',
        entries: [
            {
                label: 'num_',
                kind: CompletionItemKind.Method,
                detail: 'completion.num.detail',
                documentation: 'completion.num.doc',
                insertText: 'num_${1:value}',
            },
        ],
    },
    {
        prefix: 'mask_',
        entries: [
            {
                label: 'mask_',
                kind: CompletionItemKind.Method,
                detail: 'completion.mask.detail',
                documentation: 'completion.mask.doc',
                insertText: 'mask_${1:--vv--}',
            },
        ],
    },
    {
        prefix: 'vec',
        entries: [
            {
                label: 'vec',
                kind: CompletionItemKind.Class,
                detail: 'completion.vec0.detail',
                documentation: 'completion.vec0.doc',
            },
            {
                label: 'vec_x',
                kind: CompletionItemKind.Class,
                detail: 'completion.vec1.detail',
                documentation: 'completion.vec1.doc',
                insertText: 'vec_${1:x}',
            },
            {
                label: 'vec_x_y',
                kind: CompletionItemKind.Class,
                detail: 'completion.vec2.detail',
                documentation: 'completion.vec2.doc',
                insertText: 'vec_${1:x}_${2:y}',
            },
            {
                label: 'vec_x_y_z',
                kind: CompletionItemKind.Class,
                detail: 'completion.vec3.detail',
                documentation: 'completion.vec3.doc',
                insertText: 'vec_${1:x}_${2:y}_${3:z}',
            },
        ],
    },
    {
        prefix: 'comment_',
        entries: [
            {
                label: 'comment_',
                kind: CompletionItemKind.Snippet,
                detail: 'completion.comment.detail',
                documentation: 'completion.comment.doc',
                insertText: 'comment_${1:text}',
            },
        ],
    },
    {
        prefix: 'tab',
        entries: [
            {
                label: 'tab',
                kind: CompletionItemKind.Snippet,
                detail: 'completion.tab.detail',
                documentation: 'completion.tab.doc',
            },
            {
                label: 'tab_',
                kind: CompletionItemKind.Snippet,
                detail: 'completion.tabExplicit.detail',
                documentation: 'completion.tabExplicit.doc',
                insertText: 'tab_${1:count}',
            },
        ],
    },
    {
        prefix: '_raw',
        entries: [
            {
                label: '_',
                kind: CompletionItemKind.Value,
                detail: 'completion.raw.detail',
                documentation: 'completion.raw.doc',
                insertText: '_${1:wedsaq}',
            },
        ],
    },
]

/** All prefix entries: core + plugins */
export const ALL_PREFIXES: PrefixEntry[] = [...corePrefixes, ...allPluginPrefixes]

// ─── Build Completion Items ──────────────────────────────────

/** 短 ID（id 冒号后半部分）；无冒号时原样返回 */
function shortId(id: string): string {
    const i = id.indexOf(':')
    return i >= 0 ? id.slice(i + 1) : id
}

interface PickedPattern {
    label: string
    entry: PatternEntry
    /** 优先级：1 = ID 匹配，2 = 当前语言译名匹配，3 = en_us 译名匹配 */
    prio: number
}

/** 将某译名表中的子串命中加入 picked（跳过已收集的条目） */
function pushNameMatches(
    table: Map<string, PatternEntry[]> | undefined,
    query: string,
    raw: boolean,
    seen: Set<string>,
    picked: PickedPattern[],
    prio: number,
): void {
    if (!table) return
    for (const [name, list] of table) {
        if (!name.includes(query)) continue
        for (const entry of list) {
            if (seen.has(entry.id)) continue
            seen.add(entry.id)
            picked.push({ label: (raw ? '_' : '') + shortId(entry.id), entry, prio })
            picked.push({ label: (raw ? '_' : '') + entry.id, entry, prio })
        }
    }
}

/**
 * 收集图案补全项（子串匹配，长/短 ID 与译名统一）：
 * 1) 长/短 ID 子串匹配（最高优先级）
 * 2) 当前语言译名子串匹配（次之，已满额则跳过）
 * 3) 非英文时额外匹配 en_us 译名（再次之，已满额则跳过）
 * 命中后同时给出短名称与长名称（完整 id）两种形式；`_` 前缀 → 原始图案。
 * 通过 textEdit 将已输入 token 整体替换为选定的补全文本。
 * 索引不可用（未导出）时静默返回空。
 */
function patternSuggestions(textSoFar: string, token: Token | null | undefined): CompletionItem[] {
    const index = getPatternIndex()
    if (!index) return []

    const raw = textSoFar.startsWith('_')
    const query = (raw ? textSoFar.slice(1) : textSoFar).toLowerCase()
    const picked: PickedPattern[] = []
    const seen = new Set<string>()

    // 1) 长/短 ID 子串匹配
    for (const [short, list] of index.byShort) {
        for (const entry of list) {
            if (entry.id.toLowerCase().includes(query) || short.includes(query)) {
                seen.add(entry.id)
                picked.push({ label: (raw ? '_' : '') + short, entry, prio: 1 })
                picked.push({ label: (raw ? '_' : '') + entry.id, entry, prio: 1 })
            }
        }
    }

    // 2) 当前语言译名子串匹配
    const lang = patternLangKey()
    pushNameMatches(index.byName.get(lang), query, raw, seen, picked, 2)

    // 3) 非英文时额外匹配 en_us 译名
    if (lang !== 'en_us') {
        pushNameMatches(index.byName.get('en_us'), query, raw, seen, picked, 3)
    }

    return picked.map(({ label, entry, prio }) => {
        // VS Code 按 filterText（缺省为 label）过滤已输入文本：
        // 附加各语言译名后，中文/英文译名输入也能命中，而补全文本仍是长/短 ID
        const names = Object.values(entry.name ?? {}).filter((n): n is string => typeof n === 'string' && n.length > 0)
        const filterText = names.length > 0 ? `${label} ${names.join(' ')}` : label
        // 展开 doc 直接展示图案渐变图，不再重复显示名称文本
        const image = getPatternImage(entry)
        return {
            label,
            kind: CompletionItemKind.Value,
            detail: tr('completion.pattern.detail', { name: pickPatternName(entry), modid: entry.modid }),
            documentation: {
                kind: 'markdown',
                value: image ? `![${pickPatternName(entry)}](${image})` : formatPatternEntryText(entry),
            },
            sortText: String(prio) + ':' + label,
            insertText: label,
            // 将已输入的整个 token 替换为选定的补全文本（长/短 ID）
            textEdit: token ? { range: { start: token.start, end: token.end }, newText: label } : undefined,
            filterText,
        }
    })
}

export function buildCompletionItems(textSoFar: string, token?: Token | null): CompletionItem[] {
    const items: CompletionItem[] = []
    const lower = textSoFar.toLowerCase()

    // Check prefix matches first
    for (const { prefix, entries } of ALL_PREFIXES) {
        if (prefix.startsWith('_') && lower.startsWith('_')) continue // raw pattern handled separately
        if (lower === prefix || lower.startsWith(prefix)) {
            for (const e of entries) {
                items.push({
                    label: e.label,
                    kind: e.kind,
                    detail: e.detail ? tr(e.detail) : undefined,
                    documentation: { kind: 'markdown', value: e.documentation ? tr(e.documentation) : '' },
                    insertText: e.insertText ?? e.label,
                    insertTextFormat: e.insertText ? InsertTextFormat.Snippet : undefined, // Snippet
                })
            }
        }
    }

    // Bare keywords / constants (no prefix)
    if (!lower.includes('_') && !lower.includes('/') && !lower.includes(':') && !lower.startsWith('#')) {
        for (const e of [...DIALECTS, ...META_PATTERNS, ...CONSTANTS, ...ENTITY_REFS]) {
            if (e.label.toLowerCase().startsWith(lower)) {
                items.push({
                    label: e.label,
                    kind: e.kind,
                    detail: e.detail ? tr(e.detail) : undefined,
                    documentation: { kind: 'markdown', value: e.documentation ? tr(e.documentation) : '' },
                    insertText: e.insertText ?? e.label,
                    insertTextFormat: e.insertText ? InsertTextFormat.Snippet : undefined,
                })
            }
        }
    }

    // Macro prefix
    if (lower.startsWith('#') || lower === '#') {
        items.push({
            label: '#macro_name',
            kind: CompletionItemKind.Text,
            detail: tr('completion.macro.detail'),
            documentation: { kind: 'markdown', value: tr('completion.macro.doc') },
            insertText: '#${1:macro_name}',
            insertTextFormat: InsertTextFormat.Snippet,
        })
    }

    // Escape
    if (lower === '\\' || lower === 'escape') {
        items.push({
            label: 'escape',
            kind: CompletionItemKind.Keyword,
            detail: tr('completion.escape.detail'),
            documentation: tr('completion.escape.doc'),
        })
    }

    // Pattern name suggestions (from hexdoc dump index); skip macro/escape
    if (!lower.startsWith('#') && !lower.startsWith('\\')) {
        items.push(...patternSuggestions(textSoFar, token))
    }

    return items
}
