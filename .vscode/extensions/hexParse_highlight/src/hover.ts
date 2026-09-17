// 生成于 GLM-5V-Turbo
import { TextDocumentPositionParams, Hover } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { allPluginHovers, allValueExtractors, allEmptyDefaults } from './plugins'
import { getTokenAt } from './tokenizer'
import { t } from './i18n'
import { getPatternIndex, getDumpRemaining, pickPatternName, PatternEntry } from './patternIndex'

/** All hover entries: core + plugins (values are i18n keys) */
const HOVER_MAP: Map<string, string> = new Map(Object.entries(allPluginHovers))

/** Resolve an i18n key through t() */
function tr(key: string, params?: Record<string, string | number>): string {
    return t(key, params)
}

// ─── Pattern Name Resolution (via hexdoc dump index) ────────

/** 单条名称行：`名称 (modid)` */
function formatPatternEntry(entry: PatternEntry): string {
    return tr('hover.patternName', { name: pickPatternName(entry), modid: entry.modid })
}

/**
 * 为 pattern 类型 hover 前置图案名称区段，返回完整 markdown。
 * 索引构建失败 → 前置提示；长ID命中或短ID唯一命中 → 前置单条；短ID多命中 → 前置列表；未命中 → 原样返回。
 */
function prependPatternName(base: string, query: string): string {
    const index = getPatternIndex()
    if (!index) return tr('hover.patternIndexHint') + base

    const q = query.toLowerCase()
    const hit = index.byId.get(q)
    if (hit) {
        return `${formatPatternEntry(hit)}\n\n${base}`
    }
    const shortHits = index.byShort.get(q)
    if (shortHits && shortHits.length > 0) {
        if (shortHits.length === 1) {
            const entry = shortHits[0]
            return `${formatPatternEntry(entry)}\n\n${base}`
        }
        return tr('hover.patternNameList', { list: shortHits.map(formatPatternEntry).join(', ') }) + base
    }
    // 未命中：若导出中断仍有剩余未导出包，与无索引时提示相同信息
    if (getDumpRemaining() > 0) return tr('hover.patternIndexHint') + base
    return base
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
                value: prependPatternName(tr('hover.rawPattern', { sig: lowered.slice(1) }), lowered.slice(1)),
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
            value: prependPatternName(tr('hover.pattern', { text: token.text }), text),
        },
    }
}
