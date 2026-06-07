// 生成于 GLM-5V-Turbo
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node'
import { Entry, PrefixEntry } from './types'
import { allPluginPrefixes } from './plugins'
import { t } from './i18n'

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
    { label: 'eval', kind: CompletionItemKind.Keyword, detail: 'completion.meta.detail', documentation: 'completion.eval.doc' },
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
    { label: 'halt', kind: CompletionItemKind.Keyword, detail: 'completion.meta.detail', documentation: 'completion.halt.doc' },
    { label: 'del', kind: CompletionItemKind.Keyword, detail: 'completion.meta.detail', documentation: 'completion.del.doc' },
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
    { label: 'null', kind: CompletionItemKind.Constant, detail: 'completion.null.detail', documentation: 'completion.null.doc' },
    { label: 'NULL', kind: CompletionItemKind.Constant, detail: 'completion.nullLabel.detail', documentation: 'completion.nullLabel.doc' },
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

/** Resolve an i18n key through t() */
function tr(key: string, params?: Record<string, string | number>): string {
    return t(key, params)
}

// ─── Build Completion Items ──────────────────────────────────

export function buildCompletionItems(textSoFar: string): CompletionItem[] {
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
                    insertTextFormat: e.insertText ? 2 : undefined, // Snippet
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
                    insertTextFormat: e.insertText ? 2 : undefined,
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
            insertTextFormat: 2,
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

    return items
}
