// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'

// ─── HexFlow: Copy Mask ──────────────────────────────────────

export const hexFlowPrefixes: PrefixEntry[] = [
    {
        prefix: 'copy_mask_',
        entries: [
            {
                label: 'copy_mask_',
                kind: 24, // CompletionItemKind.Operator
                detail: 'plugin.copyMask.detail',
                documentation: 'plugin.copyMask.doc',
                insertText: 'copy_mask_${1:nn----}',
            },
        ],
    },
]

export const hexFlowHovers: HoverEntry = {
    copy_mask_: 'hover.copyMask',
}
