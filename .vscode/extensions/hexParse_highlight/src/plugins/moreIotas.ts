// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'

// ─── MoreIotas: Matrix ───────────────────────────────────────

export const moreIotasPrefixes: PrefixEntry[] = [
    {
        prefix: 'matrix_',
        entries: [
            {
                label: 'matrix_',
                kind: 11, // CompletionItemKind.Struct
                detail: 'plugin.matrix.detail',
                documentation: 'plugin.matrix.doc',
                insertText: 'matrix_${1:rows}_${2:cols}_${3:values...}',
            },
            {
                label: 'mat_',
                kind: 11,
                detail: 'plugin.matrixAlias.detail',
                documentation: 'plugin.matrixAlias.doc',
                insertText: 'mat_${1:rows}_${2:cols}_${3:values...}',
            },
        ],
    },
]

export const moreIotasHovers: HoverEntry = {
    matrix_: 'hover.matrix',
    mat_: 'hover.matrixAlias',
}
