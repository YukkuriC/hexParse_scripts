// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'

// ─── Hexcellular: Property ───────────────────────────────────

export const hexcellularPrefixes: PrefixEntry[] = [
    {
        prefix: 'prop',
        entries: [
            {
                label: 'prop_',
                kind: 12, // CompletionItemKind.Property
                detail: 'plugin.prop.detail',
                documentation: 'plugin.prop.doc',
                insertText: 'prop_${1:name}',
            },
            {
                label: 'myprop_',
                kind: 12,
                detail: 'plugin.myProp.detail',
                documentation: 'plugin.myProp.doc',
                insertText: 'myprop_${1:name}',
            },
        ],
    },
]

export const hexcellularHovers: HoverEntry = {
    prop_: 'hover.prop',
    myprop_: 'hover.myProp',
}
