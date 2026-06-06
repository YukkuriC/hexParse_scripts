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
                detail: 'Matrix (MoreIotas)',
                documentation:
                    'Matrix with row & col followed by all numbers row-by-row. Example: matrix_2_2_1_0_0_1',
                insertText: 'matrix_${1:rows}_${2:cols}_${3:values...}',
            },
            {
                label: 'mat_',
                kind: 11,
                detail: 'Matrix alias (MoreIotas)',
                documentation: 'Short alias for matrix_. Same format.',
                insertText: 'mat_${1:rows}_${2:cols}_${3:values...}',
            },
        ],
    },
]

export const moreIotasHovers: HoverEntry = {
    matrix_: '**Matrix** (`matrix_<rows>_<cols>_<values...>`) — MoreIotas MatrixIota.',
    mat_: '**Matrix** (alias) — Short form of `matrix_`.',
}
