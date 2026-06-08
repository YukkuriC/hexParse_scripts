// 生成于 GLM-5V-Turbo
import { PluginDef } from '../types'
import { CompletionItemKind } from 'vscode-languageserver/node'

// ─── Hex-Ars-Linker: Glyph ───────────────────────────────────

export const hexArsLinkerPlugin: PluginDef = {
    name: 'hexArsLinker',

    prefixes: [
        {
            prefix: 'glyph_',
            entries: [
                { label: 'glyph_', kind: CompletionItemKind.Event, detail: 'plugin.glyph.detail', documentation: 'plugin.glyph.doc', insertText: 'glyph_${1:name}' },
            ],
        },
    ],

    hovers: {
        glyph_: 'hover.glyph',
    },
}
