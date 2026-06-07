// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'

// ─── MoreIotas: Matrix & Type References ──────────────────────

export const moreIotasPrefixes: PrefixEntry[] = [
    // ── Matrix ────────────────────────────────────────────────
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
    // ── Type References (shared with Hexal) ───────────────────
    {
        prefix: 'type/',
        entries: [
            {
                label: 'type/iota_',
                kind: 9, // CompletionItemKind.Interface
                detail: 'plugin.iotaType.detail',
                documentation: 'plugin.iotaType.doc',
                insertText: 'type/iota_${1:id}',
            },
            {
                label: 'type/entity_',
                kind: 9,
                detail: 'plugin.entityType.detail',
                documentation: 'plugin.entityType.doc',
                insertText: 'type/entity_${1:id}',
            },
            {
                label: 'type/item_',
                kind: 9,
                detail: 'plugin.itemType.detail',
                documentation: 'plugin.itemType.doc',
                insertText: 'type/item_${1:id}',
            },
            {
                label: 'type/block_',
                kind: 9,
                detail: 'plugin.blockType.detail',
                documentation: 'plugin.blockType.doc',
                insertText: 'type/block_${1:id}',
            },
        ],
    },
    // ── String Literal ────────────────────────────────────────
    {
        prefix: 'str_',
        entries: [
            {
                label: 'str_',
                kind: 21, // CompletionItemKind.Constant
                detail: 'plugin.str.detail',
                documentation: 'plugin.str.doc',
                insertText: 'str_${1:content}',
            },
        ],
    },
]

export const moreIotasHovers: HoverEntry = {
    matrix_: 'hover.matrix',
    mat_: 'hover.matrixAlias',
    'type/iota_': 'hover.typeRef',
    'type/entity_': 'hover.typeRef',
    'type/item_': 'hover.typeRef',
    'type/block_': 'hover.typeRef',
    str_: 'hover.str',
}
