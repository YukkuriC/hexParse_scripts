// 生成于 GLM-5V-Turbo
import { PluginDef } from '../types'
import { CompletionItemKind } from 'vscode-languageserver/node'

// ─── Oneironaut: Dimension ───────────────────────────────────

export const oneironautPlugin: PluginDef = {
    name: 'oneironaut',

    prefixes: [
        {
            prefix: 'dim_',
            entries: [
                { label: 'dim_', kind: CompletionItemKind.Enum, detail: 'plugin.dim.detail', documentation: 'plugin.dim.doc', insertText: 'dim_${1:namespace}:${2:id}' },
            ],
        },
    ],

    hovers: {
        dim_: 'hover.dim',
    },
}
