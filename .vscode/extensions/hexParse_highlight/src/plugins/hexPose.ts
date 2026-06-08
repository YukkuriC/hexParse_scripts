// 生成于 GLM-5V-Turbo
import { PluginDef } from '../types'
import { CompletionItemKind } from 'vscode-languageserver/node'

// ─── HexPose: Identifier ─────────────────────────────────────

export const hexPosePlugin: PluginDef = {
    name: 'hexPose',

    prefixes: [
        {
            prefix: 'id_',
            entries: [
                { label: 'id_', kind: CompletionItemKind.File, detail: 'plugin.idRl.detail', documentation: 'plugin.idRl.doc', insertText: 'id_${1:resource_location}' },
            ],
        },
    ],

    hovers: {
        id_: 'hover.idRl',
    },
}
