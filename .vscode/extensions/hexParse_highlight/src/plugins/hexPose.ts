// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'

// ─── HexPose: Identifier ─────────────────────────────────────

export const hexPosePrefixes: PrefixEntry[] = [
    {
        prefix: 'id_',
        entries: [
            {
                label: 'id_',
                kind: 18, // CompletionItemKind.Reference
                detail: 'Identifier RL (HexPose)',
                documentation: 'ResourceLocation identifier. Namespace minecraft can be omitted.',
                insertText: 'id_${1:resource_location}',
            },
        ],
    },
]

export const hexPoseHovers: HoverEntry = {
    id_: '**Identifier** (HexPose) — IdentifierIota (ResourceLocation).',
}
