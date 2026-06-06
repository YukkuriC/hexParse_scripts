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
                detail: 'plugin.dim.detail',
                documentation: 'plugin.dim.doc',
                insertText: 'dim_${1:namespace}:${2:id}',
            },
        ],
    },
]

export const oneironautHovers: HoverEntry = {
    dim_: 'hover.dim',
}
