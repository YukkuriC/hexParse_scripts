// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'

// ─── Ephemera: Potion/Status ─────────────────────────────────

export const ephemeraPrefixes: PrefixEntry[] = [
    {
        prefix: 'potion_',
        entries: [
            {
                label: 'potion_',
                kind: 17, // CompletionItemKind.EnumMember
                detail: 'plugin.potion.detail',
                documentation: 'plugin.potion.doc',
                insertText: 'potion_${1:namespace}:${2:id}',
            },
        ],
    },
]

export const ephemeraHovers: HoverEntry = {
    potion_: 'hover.potion',
}
