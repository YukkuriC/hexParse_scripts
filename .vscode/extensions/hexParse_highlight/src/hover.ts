// 生成于 GLM-5V-Turbo
import { TextDocumentPositionParams, Hover, MarkupKind } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { allPluginHovers, allHoversRegex, allValueExtractors, allEmptyDefaults } from './plugins'
import { getTokenAt, Token } from './tokenizer'
import { tr } from './i18n'
import { getPatternIndex, prependPatternName } from './patternIndex'
import { HoverValue } from './types'

/** 统一派发表：区分大小写的字符串前缀 + 正则条目，按声明顺序匹配（顺序即优先级） */
interface HoverDispatch {
    id: string
    match: string | RegExp
    value: HoverValue
}
const HOVER_ITEMS: HoverDispatch[] = [
    ...allPluginHovers.map(([key, value]) => ({ id: key, match: key, value })),
    ...allHoversRegex.map(([re, value]) => ({ id: re.source, match: re, value })),
]

// ─── Hover Handler ───────────────────────────────────────────

function patternMatch(token: Token) {
    return {
        contents: {
            kind: 'markdown' as MarkupKind,
            value: prependPatternName(tr('hover.pattern', { text: token.text }), token.text),
        },
    }
}
export function handleHover(
    textDocumentPosition: TextDocumentPositionParams,
    documents: { get(uri: string): TextDocument | undefined },
): Hover | null {
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

    // ── Pattern fast-path: 与原 mod 相同，图案全字匹配优先于其余解析 ──
    // 全字命中长 id / 短 id 即直接转给 core pattern（prependPatternName）短路返回，否则继续
    const patternIndex = getPatternIndex()
    if (patternIndex) {
        const q = text.toLowerCase()
        if (patternIndex.byId.has(q) || (patternIndex.byShort.get(q)?.length ?? 0) > 0) {
            return patternMatch(token)
        }
    }

    // Table-driven match — string 前缀与正则均区分大小写，按声明顺序命中即返回
    for (const { id, match, value: rawVal } of HOVER_ITEMS) {
        // 正则：默认区分大小写，后缀取自命名捕获组 `suffix`（缺失时退回整组）
        let suffix: string
        if (match instanceof RegExp) {
            const m = match.exec(text)
            if (!m) continue
            const g = m.groups?.suffix
            suffix = g === undefined ? m[0] : g
        } else {
            if (!text.startsWith(match)) continue
            suffix = text.slice(match.length)
        }
        // 值为回调：传入后缀（匹配之后的部分）由其判断，返回 null 表示该条目不适用，跳出；
        // 返回完整对象（{kind, value}）则直接作为 hover 内容返回，跳过 i18n 注入
        const v = typeof rawVal === 'function' ? rawVal(suffix) : rawVal
        if (v === null) break
        if (typeof v === 'object') {
            return { contents: v }
        }
        // Apply empty default (e.g. num_ with no number → "0")
        let s = suffix
        if (!s && id in allEmptyDefaults) s = allEmptyDefaults[id]
        // Dispatch to registered extractor, or use raw suffix as fallback
        const extracted = id in allValueExtractors ? allValueExtractors[id](s) : s

        return {
            contents: { kind: 'markdown', value: tr(v, { value: extracted }) },
        }
    }

    // Macro
    if (text.startsWith('#')) {
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
    return patternMatch(token)
}
