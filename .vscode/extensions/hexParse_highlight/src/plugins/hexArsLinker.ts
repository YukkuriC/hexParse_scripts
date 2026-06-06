// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'

// ─── Hex-Ars-Linker: Glyph ───────────────────────────────────

export const hexArsLinkerPrefixes: PrefixEntry[] = [
    {
        prefix: 'glyph_',
        entries: [
            {
                label: 'glyph_',
                kind: 13, // CompletionItemKind.Event
                detail: 'Glyph Ref (Hex-Ars-Linker)',
                documentation:
                    'Glyph iota. ars_nouveau namespace and glyph_ prefix can be omitted.',
                insertText: 'glyph_${1:name}',
            },
        ],
    },
]

export const hexArsLinkerHovers: HoverEntry = {
    glyph_:
        '**Glyph** (Hex-Ars-Linker) — GlyphIota.\nNamespace `ars_nouveau` and `glyph_` prefix can be omitted.',
}
