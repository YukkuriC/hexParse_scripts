// 生成于 GLM-5V-Turbo
import { PluginDef, ValueExtractor, TokenValidator } from '../types'

// ─── Core Built-in Types ─────────────────────────────────────

const extractVec: ValueExtractor = (suffix) => {
    const parts = suffix.split('_').filter(Boolean)
    return `(${parts[0] || '0'}, ${parts[1] || '0'}, ${parts[2] || '0'})`
}

export const corePlugin: PluginDef = {
    name: 'core',

    prefixes: [], // core types don't have prefix completions (they're in completion.ts directly)

    hovers: {
        thoth: 'hover.thoth',
        iris: 'hover.iris',
        if: 'hover.if',
        eval: 'hover.eval',
        'eval/cc': 'hover.evalcc',
        for_each: 'hover.foreach',
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
        mask_: 'hover.mask',
        vec: 'hover.vec',
        entity_: 'hover.entity',
        comment_: 'hover.comment',
        tab: 'hover.tab',
        escape: 'hover.escape',
    },

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
