// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'

// ─── Hexal: Gate & Mote ──────────────────────────────────────

export const hexalPrefixes: PrefixEntry[] = [
    {
        prefix: 'gate',
        entries: [
            {
                label: 'gate',
                kind: 3, // CompletionItemKind.Function
                detail: 'Gate (unbound)',
                documentation:
                    'Unbound gate (Hexal). NOTE: Extra cost for making gates. Parsed gates have negative IDs.',
            },
            {
                label: 'gate_pos',
                kind: 3,
                detail: 'Gate (position-bound)',
                documentation: 'Position-bound gate. Format: gate_x_y_z',
                insertText: 'gate_${1:x}_${2:y}_${3:z}',
            },
            {
                label: 'gate_entity',
                kind: 3,
                detail: 'Gate (entity-bound)',
                documentation: 'Entity-bound gate. Format: gate_uuid[_x_y_z]',
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
                detail: 'Mote (Hexal)',
                documentation: 'Mote from a nexus. Format: mote_uuid_idx',
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
                detail: 'Iota Type',
                documentation: 'Iota type by ID (MoreIotas/Hexal). Namespace hexcasting: can be omitted.',
                insertText: 'type/iota_${1:id}',
            },
            {
                label: 'type/entity_',
                kind: 9,
                detail: 'Entity Type',
                documentation: 'Entity type by ID. Namespace minecraft: can be omitted.',
                insertText: 'type/entity_${1:id}',
            },
            {
                label: 'type/item_',
                kind: 9,
                detail: 'Item Type',
                documentation: 'Item type by ID. Namespace minecraft: can be omitted.',
                insertText: 'type/item_${1:id}',
            },
            {
                label: 'type/block_',
                kind: 9,
                detail: 'Block Type',
                documentation: 'Block type by ID. Namespace minecraft: can be omitted.',
                insertText: 'type/block_${1:id}',
            },
        ],
    },
]

export const hexalHovers: HoverEntry = {
    gate:
        '**Gate** (Hexal) — GateIota. Unbound or position/entity bound.\nFormat: `gate`, `gate_x_y_z`, `gate_uuid[_x_y_z]`\nNOTE: Extra cost. Parsed gates have negative IDs.',
    'type/':
        '**Type Reference** (`type/<kind>_<id>`) — MoreIotas/Hexal type iota.\nKinds: `iota`, `entity`, `item`, `block`.',
    mote_: '**Mote** (Hexal) — MoteIota from a nexus. Format: `mote_<uuid>_<idx>`.',
}
