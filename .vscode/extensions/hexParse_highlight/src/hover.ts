// 生成于 GLM-5V-Turbo
import { TextDocumentPositionParams, Hover } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { allPluginHovers, allValueExtractors, allEmptyDefaults } from './plugins'
import { getTokenAt } from './tokenizer'
import { t } from './i18n'

/** All hover entries: core + plugins (values are i18n keys) */
const HOVER_MAP: Map<string, string> = new Map(Object.entries(allPluginHovers))

/** Resolve an i18n key through t() */
function tr(key: string, params?: Record<string, string | number>): string {
    return t(key, params)
}

// ─── Hover Handler ───────────────────────────────────────────

export function handleHover(textDocumentPosition: TextDocumentPositionParams, documents: { get(uri: string): TextDocument | undefined }): Hover | null {
    const doc = documents.get(textDocumentPosition.textDocument.uri)
    if (!doc) return null

    const token = getTokenAt(doc, textDocumentPosition.position)
    if (!token) return null

    const text = token.text

    // ── Comment token (line or block) → skip pattern matching ──
    if (text.startsWith('//') || text.startsWith('/*')) {
        return null
    }

    // ── Quoted string literal → skip pattern matching ──
    if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
        return {
            contents: {
                kind: 'markdown',
                value: tr('hover.string', { text }),
            },
        }
    }

    const lowered = text.toLowerCase()

    // Exact match
    if (HOVER_MAP.has(lowered)) {
        return {
            contents: { kind: 'markdown', value: tr(HOVER_MAP.get(lowered)!) },
        }
    }

    // Prefix match — table-driven value extraction
    for (const [key, val] of HOVER_MAP) {
        if (!lowered.startsWith(key)) continue
        let suffix = lowered.slice(key.length)
        // Apply empty default (e.g. num_ with no number → "0")
        if (!suffix && key in allEmptyDefaults) suffix = allEmptyDefaults[key]
        // Dispatch to registered extractor, or use raw suffix as fallback
        const extracted = key in allValueExtractors ? allValueExtractors[key](suffix) : suffix

        return {
            contents: { kind: 'markdown', value: tr(val, { value: extracted }) },
        }
    }

    // Raw pattern
    if (lowered.startsWith('_') && lowered.length > 1) {
        return {
            contents: {
                kind: 'markdown',
                value: tr('hover.rawPattern', { sig: lowered.slice(1) }),
            },
        }
    }

    // Macro
    if (lowered.startsWith('#')) {
        return {
            contents: {
                kind: 'markdown',
                value: tr('hover.macro', { text }),
            },
        }
    }

    // Group bracket (paren or brace, equivalent)
    if (text === '(' || text === '{') {
        return {
            contents: {
                kind: 'markdown',
                value: tr('hover.groupOpen', { bracket: token.text }),
            },
        }
    }
    if (text === ')' || text === '}') {
        return {
            contents: {
                kind: 'markdown',
                value: tr('hover.groupClose'),
            },
        }
    }

    // Nested list bracket
    if (text === '[') {
        return { contents: { kind: 'markdown', value: tr('hover.listOpen') } }
    }
    if (text === ']') {
        return { contents: { kind: 'markdown', value: tr('hover.listClose') } }
    }

    // Bare numeric literal → numeric constant (not a pattern; use num_ prefix for PatternIota)
    if (/^-?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?$/.test(text)) {
        return {
            contents: { kind: 'markdown', value: tr('hover.numericLiteral', { text }) },
        }
    }

    // Generic pattern
    return {
        contents: {
            kind: 'markdown',
            value: tr('hover.pattern', { text: token.text }),
        },
    }
}
