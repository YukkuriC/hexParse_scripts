// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'

// ─── Oneironaut: Dimension ───────────────────────────────────

export const oneironautPrefixes: PrefixEntry[] = [
    {
        prefix: 'dim_',
        entries: [
            {
                label: 'dim_',
                kind: 16, // CompletionItemKind.Enum
                detail: 'Dimension (Oneironaut)',
                documentation: 'Dimension iota by ID. Namespace minecraft: can be omitted.',
                insertText: 'dim_${1:namespace}:${2:id}',
            },
        ],
    },
]

export const oneironautHovers: HoverEntry = {
    dim_: '**Dimension** (Oneironaut) — DimIota. Namespace `minecraft:` omittable.',
}
