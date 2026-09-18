// 生成于 GLM-5V-Turbo
import { PluginDef } from '../types'
import { CompletionItemKind } from 'vscode-languageserver/node'

// ─── Hexcellular: Property ───────────────────────────────────

// prop_ 别名 property_：原 mod Regex `^prop(erty)?_`；myprop_ 保持独立前缀
const RE_PROP = /^prop(?:erty)?_(?<suffix>.*)$/

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
        myprop_: 'hover.myProp',
    },

    hoversRegex: [
        [RE_PROP, 'hover.prop'],
    ],
}
