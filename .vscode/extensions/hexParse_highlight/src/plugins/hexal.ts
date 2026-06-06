// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'
// No t() import — values are i18n keys, resolved at consumption time

// ─── Hexal: Gate & Mote ──────────────────────────────────────

export const hexalPrefixes: PrefixEntry[] = [
    {
        prefix: 'gate',
        entries: [
            {
                label: 'gate',
                kind: 3, // CompletionItemKind.Function
                detail: 'plugin.gate.detail',
                documentation: 'plugin.gate.doc',
            },
            {
                label: 'gate_pos',
                kind: 3,
                detail: 'plugin.gatePos.detail',
                documentation: 'plugin.gatePos.doc',
                insertText: 'gate_${1:x}_${2:y}_${3:z}',
            },
            {
                label: 'gate_entity',
                kind: 3,
                detail: 'plugin.gateEnt.detail',
                documentation: 'plugin.gateEnt.doc',
                insertText: 'gate_${1:self|uuid}_${2:x}_${3:y}_${4:z}',
            },
        ],
    },
    {
        prefix: 'mote_',
        entries: [
            {
                label: 'mote_',
                kind: 7, // CompletionItemKind.Class
                detail: 'plugin.mote.detail',
                documentation: 'plugin.mote.doc',
                insertText: 'mote_${1:uuid}_${2:index}',
            },
        ],
    },
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
]

export const hexalHovers: HoverEntry = {
    gate: 'hover.gate',
    'type/': 'hover.typeRef',
    mote_: 'hover.mote',
}
