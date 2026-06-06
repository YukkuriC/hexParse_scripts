// 生成于 GLM-5V-Turbo
import { TextDocumentPositionParams, Hover } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { HoverEntry } from './types'
import { allPluginHovers } from './plugins'
import { getTokenAt } from './tokenizer'

// ─── Core Hover Data (Hexcasting built-in) ───────────────────

const coreHovers: HoverEntry = {
    thoth: '**Thoth** dialect — built-in dialect for single token parsing',
    iris: '**Iris** dialect — built-in dialect for single token parsing',
    if: '**If** — Conditional execution meta pattern',
    eval: '**Eval** — Evaluation meta pattern',
    'eval/cc': '**Eval/CC** — Eval with continuation',
    for_each: '**For Each** — Iterate over list elements',
    halt: '**Halt** — Stop execution',
    del: '**Del** — Drop top of stack',
    hermes: '**Hermes** — Hermes meta pattern',
    true: '**true** — BooleanIota `true`',
    false: '**false** — BooleanIota `false`',
    null: '**null** — NullIota',
    garbage: '**garbage** — GarbageIota',
    self: '**self** — EntityIota of the casting player',
    myself: '**myself** — Alias for `self`',
    num_: '**Number Pattern** (`num_<value>`) — Numerical Reflection → PatternIota\n\nExample: `num_1.375`',
    mask_:
        "**Mask Pattern** (`mask_<pattern>`) — Bookkeeper's Gambit → PatternIota\n\nUse `-` (dash) and `v` characters.\n\nExample: `mask_--vv--`",
    vec: '**Vector** (`vec[_x][_y][_z]`) — Vec3Iota. Unassigned axes default to 0.',
    str_: '**String** (`str_<content>`) — StringIota. No spaces or escaping.',
    entity_: '**Entity UUID** (`entity_<uuid>`) — EntityIota by UUID.',
    comment_: '**Comment Iota** — CommentIota displayed as text, not executed.',
    tab: '**Tab Indent** — CommentIota with linebreak + leading spaces. Auto-added on multi-line input.',
    escape: '**Escape** — Alternative to `\\\\` for Introspection/Retrospection/Consideration.',
}

/** All hover entries: core + plugins */
const HOVER_MAP: Map<string, string> = new Map([...Object.entries(coreHovers), ...Object.entries(allPluginHovers)])

// ─── Hover Handler ───────────────────────────────────────────

export function handleHover(textDocumentPosition: TextDocumentPositionParams, documents: { get(uri: string): TextDocument | undefined }): Hover | null {
    const doc = documents.get(textDocumentPosition.textDocument.uri)
    if (!doc) return null

    const token = getTokenAt(doc, textDocumentPosition.position)
    if (!token) return null

    const text = token.text.toLowerCase()

    // Exact match
    if (HOVER_MAP.has(text)) {
        return {
            contents: { kind: 'markdown', value: HOVER_MAP.get(text)! },
        }
    }

    // Prefix match
    for (const [key, val] of HOVER_MAP) {
        if (text.startsWith(key)) {
            return {
                contents: { kind: 'markdown', value: val },
            }
        }
    }

    // Raw pattern
    if (text.startsWith('_') && text.length > 1) {
        return {
            contents: {
                kind: 'markdown',
                value: '**Raw Pattern** — Pattern with angle signature `' + text.slice(1) + '`\n\n→ PatternIota',
            },
        }
    }

    // Macro
    if (text.startsWith('#')) {
        return {
            contents: {
                kind: 'markdown',
                value: '**Macro** — User-defined macro reference: `' + text + '`\n\n→ resolved at parse time',
            },
        }
    }

    // Group bracket (paren or brace, equivalent)
    if (text === '(' || text === '{') {
        return {
            contents: {
                kind: 'markdown',
                value: '**Group Open** — Non-functional pattern wrapper (`' + token.text + '`)\n\nEquivalent to Introspection. Must be closed by `)` or `}`.',
            },
        }
    }
    if (text === ')' || text === '}') {
        return {
            contents: {
                kind: 'markdown',
                value: '**Group Close** — Closes a group opened by `(` or `{`\n\nEquivalent to Retrospection.',
            },
        }
    }

    // Nested list bracket
    if (text === '[') {
        return { contents: { kind: 'markdown', value: '**Nested List Open** — Begins a ListIota. Must be closed by `]`.' } }
    }
    if (text === ']') {
        return { contents: { kind: 'markdown', value: '**Nested List Close** — Ends a ListIota.' } }
    }

    // Generic pattern
    return {
        contents: {
            kind: 'markdown',
            value:
                '**Pattern** — Normal static pattern matched by registration key: `' + token.text + '`\n\n→ PatternIota',
        },
    }
}
