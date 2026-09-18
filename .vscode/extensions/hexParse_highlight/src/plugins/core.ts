// 生成于 GLM-5V-Turbo
import { PluginDef, ValueExtractor, TokenValidator, HoverResult } from '../types'
import { tr } from '../i18n'
import {
    PatternEntry,
    resolveRawPattern,
    pickPatternName,
    getPatternImage,
    prependPatternName,
    formatPatternEntryText,
} from '../patternIndex'

// ─── Core Built-in Types ─────────────────────────────────────

const extractVec: ValueExtractor = (suffix) => {
    const parts = suffix.split('_').filter(Boolean)
    return `(${parts[0] || '0'}, ${parts[1] || '0'}, ${parts[2] || '0'})`
}

// thoth / for_each：仅允许 `_数字` 步数后缀（对齐原 mod 的 Regex `^(thoth|for_each)(_\d+)?$`）
const RE_THOTH = /^thoth(?<suffix>_\d+)?$/
const RE_FOREACH = /^for_each(?<suffix>_\d+)?$/
// mask_：后缀仅允许 `-`/`v`（对齐原 mod 的 Regex `^mask_[-v]+$`）
const RE_MASK = /^mask_(?<suffix>[-v]+)$/
// 后缀：空（裸 entity_）或实体 UUID；entity_pos/eye 等图案名 → 不命中
const RE_ENTITY = /^entity_(?<suffix>(?:[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12})?)$/
// 原始图案：`_` + 任意角度串；空角度串（裸 `_`）由回调返回 null 跳出，走通用图案 hover
const RE_RAW_PATTERN = /^_(?<suffix>[wedsaq]*)$/

/** raw pattern hover：渲染角度串为 SVG 图片（合成 EAST 起始条目），失败则退回名称+说明文本 */
const rawPatternHover = (sig: string): HoverResult => {
    if (!sig) return null
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
                kind: 'markdown',
                value: `![${name}](${image})\n\n${nameLine ? nameLine + '\n\n' : ''}${base}`,
            }
        }
    }
    return { kind: 'markdown', value: prependPatternName(base, sig) }
}

export const corePlugin: PluginDef = {
    name: 'core',

    prefixes: [], // core types don't have prefix completions (they're in completion.ts directly)

    hovers: {
        iris: 'hover.iris',
        if: 'hover.if',
        eval: 'hover.eval',
        'eval/cc': 'hover.evalcc',
        halt: 'hover.halt',
        del: 'hover.del',
        hermes: 'hover.hermes',
        true: 'hover.true',
        false: 'hover.false',
        null: 'hover.null',
        garbage: 'hover.garbage',
        self: 'hover.self',
        myself: 'hover.myself',
        num_: 'hover.num',
        vec: 'hover.vec', // 原 mod 为 Prefix("vec")，任意后缀均解析
        comment_: 'hover.comment',
        tab: 'hover.tab',
        escape: 'hover.escape',
    },

    hoversRegex: [
        [RE_THOTH, 'hover.thoth'],
        [RE_FOREACH, 'hover.foreach'],
        [RE_MASK, 'hover.mask'],
        [RE_ENTITY, 'hover.entity'],
        [RE_RAW_PATTERN, rawPatternHover],
    ],

    valueExtractors: {
        vec: extractVec,
    },

    emptyDefaults: {
        num_: '0',
    },

    validators: [
        // Entity UUID format validation
        {
            test: (t) => t.startsWith('entity_') && t.includes('-'),
            validate: (t_text) => {
                const uuid = t_text.slice(7)
                const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
                if (!uuidRegex.test(uuid)) return { key: 'validation.invalidUuid', params: { uuid } }
                return null
            },
        },
        // Mask pattern char validation
        {
            test: (t) => t.startsWith('mask_') && t.length > 5,
            validate: (t_text) => {
                const m = t_text.slice(5)
                if (!/^[v\-]+$/.test(m)) return { key: 'validation.maskChars', params: { m } }
                return null
            },
        },
    ],
}
