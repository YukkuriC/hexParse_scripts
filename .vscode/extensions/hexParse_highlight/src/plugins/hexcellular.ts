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
                detail: 'Property (Hexcellular)',
                documentation:
                    'Property iota. NOTE: Extra cost. All parsed properties start with underscore and may conflict.',
                insertText: 'prop_${1:name}',
            },
            {
                label: 'myprop_',
                kind: 12,
                detail: 'My Property (Hexcellular)',
                documentation: 'Player-specific property iota. Same notes as prop_.',
                insertText: 'myprop_${1:name}',
            },
        ],
    },
]

export const hexcellularHovers: HoverEntry = {
    prop_: '**Property** (Hexcellular) — PropertyIota.\nNOTE: Extra cost. Starts with underscore.',
    myprop_: '**My Property** (Hexcellular) — Player-specific PropertyIota.',
}
