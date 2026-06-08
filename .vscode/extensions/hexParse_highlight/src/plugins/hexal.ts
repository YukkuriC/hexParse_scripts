// 生成于 GLM-5V-Turbo
import { PluginDef, ValueExtractor } from '../types'
import { CompletionItemKind } from 'vscode-languageserver/node'

// ─── Hexal: Gate & Mote ──────────────────────────────────────

const extractGate: ValueExtractor = (suffix) => {
    if (!suffix) return '(unbound)'
    const parts = suffix.split('_').filter(Boolean)
    const first = parts[0]

    if (first === 'self') {
        const o = parts.slice(1)
        if (o.length > 0) return `(caster) + (${o[0] || '0'}, ${o[1] || '0'}, ${o[2] || '0'})`
        return `(caster)`
    }

    if (first.includes('-')) {
        const o = parts.slice(1)
        if (o.length > 0) return `(entity: ${first}) + (${o[0] || '0'}, ${o[1] || '0'}, ${o[2] || '0'})`
        return `(entity: ${first})`
    }

    return `(position: ${parts[0] || '0'}, ${parts[1] || '0'}, ${parts[2] || '0'})`
}

export const hexalPlugin: PluginDef = {
    name: 'hexal',

    prefixes: [
        {
            prefix: 'gate',
            entries: [
                { label: 'gate', kind: CompletionItemKind.Function, detail: 'plugin.gate.detail', documentation: 'plugin.gate.doc' },
                { label: 'gate_pos', kind: CompletionItemKind.Function, detail: 'plugin.gatePos.detail', documentation: 'plugin.gatePos.doc', insertText: 'gate_${1:x}_${2:y}_${3:z}' },
                { label: 'gate_entity', kind: CompletionItemKind.Function, detail: 'plugin.gateEnt.detail', documentation: 'plugin.gateEnt.doc', insertText: 'gate_${1:self|uuid}_${2:x}_${3:y}_${4:z}' },
            ],
        },
        {
            prefix: 'mote_',
            entries: [
                { label: 'mote_', kind: CompletionItemKind.Field, detail: 'plugin.mote.detail', documentation: 'plugin.mote.doc', insertText: 'mote_${1:uuid}_${2:index}' },
            ],
        },
    ],

    hovers: {
        gate: 'hover.gate',
        mote_: 'hover.mote',
    },

    valueExtractors: {
        gate: extractGate,
    },
}
