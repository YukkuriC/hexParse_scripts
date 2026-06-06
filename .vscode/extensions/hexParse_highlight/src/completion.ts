// 生成于 GLM-5V-Turbo
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node'
import { Entry, PrefixEntry } from './types'
import { allPluginPrefixes } from './plugins'

// ─── Core Completion Data (Hexcasting built-in) ──────────────

export const DIALECTS: Entry[] = [
    {
        label: 'thoth',
        kind: CompletionItemKind.Keyword,
        detail: 'Dialect',
        documentation: 'Thoth dialect for single token parsing',
    },
    {
        label: 'iris',
        kind: CompletionItemKind.Keyword,
        detail: 'Dialect',
        documentation: 'Iris dialect for single token parsing',
    },
]

export const META_PATTERNS: Entry[] = [
    {
        label: 'if',
        kind: CompletionItemKind.Keyword,
        detail: 'Meta Pattern',
        documentation: 'Conditional execution pattern',
    },
    { label: 'eval', kind: CompletionItemKind.Keyword, detail: 'Meta Pattern', documentation: 'Evaluation pattern' },
    {
        label: 'eval/cc',
        kind: CompletionItemKind.Keyword,
        detail: 'Meta Pattern',
        documentation: 'Eval with continuation',
    },
    {
        label: 'for_each',
        kind: CompletionItemKind.Keyword,
        detail: 'Meta Pattern',
        documentation: 'Iteration over list',
    },
    { label: 'halt', kind: CompletionItemKind.Keyword, detail: 'Meta Pattern', documentation: 'Halt execution' },
    { label: 'del', kind: CompletionItemKind.Keyword, detail: 'Meta Pattern', documentation: 'Delete / drop' },
    { label: 'hermes', kind: CompletionItemKind.Keyword, detail: 'Meta Pattern', documentation: 'Hermes pattern' },
]

export const CONSTANTS: Entry[] = [
    {
        label: 'true',
        kind: CompletionItemKind.Constant,
        detail: 'Boolean',
        documentation: 'Boolean true (case insensitive)',
    },
    {
        label: 'false',
        kind: CompletionItemKind.Constant,
        detail: 'Boolean',
        documentation: 'Boolean false (case insensitive)',
    },
    { label: 'null', kind: CompletionItemKind.Constant, detail: 'Null', documentation: 'NullIota (case insensitive)' },
    { label: 'NULL', kind: CompletionItemKind.Constant, detail: 'Null', documentation: 'NullIota (case insensitive)' },
    {
        label: 'garbage',
        kind: CompletionItemKind.Constant,
        detail: 'Garbage',
        documentation: 'GarbageIota (case insensitive)',
    },
]

export const ENTITY_REFS: Entry[] = [
    {
        label: 'self',
        kind: CompletionItemKind.Variable,
        detail: 'Entity Reference',
        documentation: 'The player caster as EntityIota',
    },
    {
        label: 'myself',
        kind: CompletionItemKind.Variable,
        detail: 'Entity Reference',
        documentation: 'Alias for self (case insensitive)',
    },
    {
        label: 'entity_',
        kind: CompletionItemKind.Variable,
        detail: 'Entity UUID',
        documentation: 'Entity reference by UUID format: entity_<uuid>',
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
                detail: 'Number Pattern',
                documentation: 'Numerical Reflection pattern. Output: PatternIota. Example: num_1.375',
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
                detail: 'Mask Pattern',
                documentation: "Bookkeeper's Gambit mask. Use - and v chars. Example: mask_--vv--",
                insertText: 'mask_${1:--vv--}',
            },
        ],
    },
    {
        prefix: 'str_',
        entries: [
            {
                label: 'str_',
                kind: CompletionItemKind.Constant,
                detail: 'String Literal',
                documentation: 'String literal via str_ prefix. No spaces/escaping supported.',
                insertText: 'str_${1:content}',
            },
        ],
    },
    {
        prefix: 'vec',
        entries: [
            {
                label: 'vec',
                kind: CompletionItemKind.Class,
                detail: 'Vector (zero)',
                documentation: 'Zero vector Vec3Iota',
            },
            {
                label: 'vec_x',
                kind: CompletionItemKind.Class,
                detail: 'Vector (1-axis)',
                documentation: 'Vec3Iota with x axis only',
                insertText: 'vec_${1:x}',
            },
            {
                label: 'vec_x_y',
                kind: CompletionItemKind.Class,
                detail: 'Vector (2-axis)',
                documentation: 'Vec3Iota with x,y axes',
                insertText: 'vec_${1:x}_${2:y}',
            },
            {
                label: 'vec_x_y_z',
                kind: CompletionItemKind.Class,
                detail: 'Vector (3-axis)',
                documentation: 'Vec3Iota with x,y,z axes',
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
                detail: 'Comment Iota',
                documentation: 'Comment displayed as text but not executed. Same limitations as strings.',
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
                detail: 'Tab Indent Comment',
                documentation: 'Comment containing linebreak + leading spaces of given amount.',
            },
            {
                label: 'tab_',
                kind: CompletionItemKind.Snippet,
                detail: 'Tab Indent Comment (explicit)',
                documentation: 'Same as tab but with explicit count.',
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
                detail: 'Raw Pattern',
                documentation: 'Pattern with given angle signature (e.g. _wedsaq). Output: PatternIota',
                insertText: '_${1:wedsaq}',
            },
        ],
    },
]

/** All prefix entries: core + plugins */
export const ALL_PREFIXES: PrefixEntry[] = [...corePrefixes, ...allPluginPrefixes]

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
                    detail: e.detail,
                    documentation: { kind: 'markdown', value: e.documentation ?? '' },
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
                    detail: e.detail,
                    documentation: { kind: 'markdown', value: e.documentation ?? '' },
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
            detail: 'Macro Reference',
            documentation: 'User-defined macro. Replace macro_name with your defined macro.',
            insertText: '#${1:macro_name}',
            insertTextFormat: 2,
        })
    }

    // Escape
    if (lower === '\\' || lower === 'escape') {
        items.push({
            label: 'escape',
            kind: CompletionItemKind.Keyword,
            detail: 'Escape Character',
            documentation: 'Alternative to \\\\ for non-functional patterns',
        })
    }

    return items
}
