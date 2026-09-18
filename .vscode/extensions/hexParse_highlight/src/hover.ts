// 生成于 GLM-5V-Turbo
import { TextDocumentPositionParams, Hover } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { allPluginHovers, allValueExtractors, allEmptyDefaults } from './plugins'
import { getTokenAt } from './tokenizer'
import { tr } from './i18n'
import { getPatternIndex, getDumpRemaining, pickPatternName, getPatternImage, resolveRawPattern, PatternEntry } from './patternIndex'
import { HoverValue } from './types'

/** All hover entries: core + plugins (values are i18n keys or predicate callbacks) */
const HOVER_MAP: Map<string, HoverValue> = new Map(Object.entries(allPluginHovers))

// ─── Pattern Name Resolution (via hexdoc dump index) ────────

/** 单条名称行：`![图案名](图片) 名称 (modid)`；无渲染时退回纯文本 */
function formatPatternEntry(entry: PatternEntry): string {
    const name = pickPatternName(entry)
    const text = tr('hover.patternName', { name, modid: entry.modid })
    const image = getPatternImage(entry)
    return image ? `![${name}](${image}) ${text}` : text
}

/** 纯文本名称行（多命中列表等场景，不带图） */
function formatPatternEntryText(entry: PatternEntry): string {
    return tr('hover.patternName', { name: pickPatternName(entry), modid: entry.modid })
}

/** 前置区段与 base 之间的统一分隔线 */
const NAME_BASE_SEP = '\n\n---\n\n'

/**
 * 为 pattern 类型 hover 前置图案名称区段，返回完整 markdown。
 * 索引构建失败 → 前置提示；长ID命中或短ID唯一命中 → 前置单条；短ID多命中 → 前置列表；未命中 → 原样返回。
 */
function prependPatternName(base: string, query: string): string {
    const index = getPatternIndex()
    if (!index) return tr('hover.patternIndexHint') + NAME_BASE_SEP + base

    const q = query.toLowerCase()
    const hit = index.byId.get(q)
    if (hit) {
        return `${formatPatternEntry(hit)}${NAME_BASE_SEP}${base}`
    }
    const shortHits = index.byShort.get(q)
    if (shortHits && shortHits.length > 0) {
        if (shortHits.length === 1) {
            const entry = shortHits[0]
            return `${formatPatternEntry(entry)}${NAME_BASE_SEP}${base}`
        }
        return tr('hover.patternNameList', { list: shortHits.map(formatPatternEntryText).join(', ') }) + NAME_BASE_SEP + base
    }
    // 未命中：若导出中断仍有剩余未导出包，与无索引时提示相同信息
    if (getDumpRemaining() > 0) return tr('hover.patternIndexHint') + NAME_BASE_SEP + base
    return base
}

// ─── Hover Handler ───────────────────────────────────────────

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

    const lowered = text.toLowerCase()

    // Table-driven match — exact keys are handled naturally as empty-suffix prefix matches
    for (const [key, rawVal] of HOVER_MAP) {
        if (!lowered.startsWith(key)) continue
        const suffix = lowered.slice(key.length)
        // 值为回调：传入后缀（key 之后的部分）由其判断，返回 null 表示不适用，跳出
        const v = typeof rawVal === 'function' ? rawVal(suffix) : rawVal
        if (v === null) break
        // Apply empty default (e.g. num_ with no number → "0")
        let s = suffix
        if (!s && key in allEmptyDefaults) s = allEmptyDefaults[key]
        // Dispatch to registered extractor, or use raw suffix as fallback
        const extracted = key in allValueExtractors ? allValueExtractors[key](s) : s

        return {
            contents: { kind: 'markdown', value: tr(v, { value: extracted }) },
        }
    }

    // Raw pattern
    if (/^_[wedsaq]*$/.test(lowered) && lowered.length > 1) {
        const sig = lowered.slice(1)
        const base = tr('hover.rawPattern', { sig })
        // 合法角度串且长度 < 64：尝试渲染图案（合成 EAST 起始条目，不缓存）
        if (sig.length < 64 && /^[wedsaq]+$/.test(sig)) {
            const entry = resolveRawPattern(sig)
            const synth: PatternEntry = {
                id: 'raw:' + sig,
                name: entry?.name ?? {},
                modid: entry?.modid ?? '',
                startdir: 'EAST',
                signature: sig,
            }
            const image = getPatternImage(synth, { cache: false })
            if (image) {
                const name = entry ? pickPatternName(entry) : sig
                const nameLine = entry ? formatPatternEntryText(entry) : ''
                return {
                    contents: {
                        kind: 'markdown',
                        value: `![${name}](${image})\n\n${nameLine ? nameLine + '\n\n' : ''}${base}`,
                    },
                }
            }
        }
        return {
            contents: {
                kind: 'markdown',
                value: prependPatternName(base, sig),
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
