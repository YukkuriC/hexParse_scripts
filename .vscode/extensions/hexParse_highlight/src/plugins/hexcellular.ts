// 生成于 GLM-5V-Turbo
import { PluginDef } from '../types'
import { CompletionItemKind } from 'vscode-languageserver/node'

// ─── Hexcellular: Property ───────────────────────────────────

export const hexcellularPlugin: PluginDef = {
    name: 'hexcellular',

    prefixes: [
        {
            prefix: 'prop',
            entries: [
                { label: 'prop_', kind: CompletionItemKind.Property, detail: 'plugin.prop.detail', documentation: 'plugin.prop.doc', insertText: 'prop_${1:name}' },
                { label: 'myprop_', kind: CompletionItemKind.Property, detail: 'plugin.myProp.detail', documentation: 'plugin.myProp.doc', insertText: 'myprop_${1:name}' },
            ],
        },
    ],

    hovers: {
        prop_: 'hover.prop',
        myprop_: 'hover.myProp',
    },
}
