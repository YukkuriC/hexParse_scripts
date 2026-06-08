// 生成于 GLM-5V-Turbo
import { PluginDef } from '../types'
import { CompletionItemKind } from 'vscode-languageserver/node'

// ─── Ephemera: Potion/Status ─────────────────────────────────

export const ephemeraPlugin: PluginDef = {
    name: 'ephemera',

    prefixes: [
        {
            prefix: 'potion_',
            entries: [
                { label: 'potion_', kind: CompletionItemKind.EnumMember, detail: 'plugin.potion.detail', documentation: 'plugin.potion.doc', insertText: 'potion_${1:namespace}:${2:id}' },
            ],
        },
    ],

    hovers: {
        potion_: 'hover.potion',
    },
}
