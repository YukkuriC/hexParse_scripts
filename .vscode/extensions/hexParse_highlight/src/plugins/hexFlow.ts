// 生成于 GLM-5V-Turbo
import { PluginDef } from '../types'
import { CompletionItemKind } from 'vscode-languageserver/node'

// ─── HexFlow: Meta Patterns & Copy Mask ───────────────────────

export const hexFlowPlugin: PluginDef = {
    name: 'hexFlow',

    prefixes: [
        // ── for_range family ──────────────────────────────────────
        {
            prefix: 'for_range/',
            entries: [
                { label: 'for_range/cube', kind: CompletionItemKind.Operator, detail: 'plugin.forRangeCube.detail', documentation: 'plugin.forRangeCube.doc' },
                { label: 'for_range/cube/pure', kind: CompletionItemKind.Operator, detail: 'plugin.forRangeCubePure.detail', documentation: 'plugin.forRangeCubePure.doc' },
                { label: 'for_range/line', kind: CompletionItemKind.Operator, detail: 'plugin.forRangeLine.detail', documentation: 'plugin.forRangeLine.doc' },
                { label: 'for_range/line/pure', kind: CompletionItemKind.Operator, detail: 'plugin.forRangeLinePure.detail', documentation: 'plugin.forRangeLinePure.doc' },
                { label: 'for_range/floodfill', kind: CompletionItemKind.Operator, detail: 'plugin.forRangeFloodfill.detail', documentation: 'plugin.forRangeFloodfill.doc' },
                { label: 'for_range/floodfill/pure', kind: CompletionItemKind.Operator, detail: 'plugin.forRangeFloodfillPure.detail', documentation: 'plugin.forRangeFloodfillPure.doc' },
            ],
        },
        // ── pure_ family ──────────────────────────────────────────
        {
            prefix: 'pure_',
            entries: [
                { label: 'pure_map', kind: CompletionItemKind.Operator, detail: 'plugin.pureMap.detail', documentation: 'plugin.pureMap.doc' },
                { label: 'pure_reduce', kind: CompletionItemKind.Operator, detail: 'plugin.pureReduce.detail', documentation: 'plugin.pureReduce.doc' },
            ],
        },
        // ── call_stack ───────────────────────────────────────────
        {
            prefix: 'call_stack',
            entries: [
                { label: 'call_stack', kind: CompletionItemKind.Operator, detail: 'plugin.callStack.detail', documentation: 'plugin.callStack.doc' },
            ],
        },
        // ── copy_mask ────────────────────────────────────────────
        {
            prefix: 'copy_mask_',
            entries: [
                { label: 'copy_mask_', kind: CompletionItemKind.Color, detail: 'plugin.copyMask.detail', documentation: 'plugin.copyMask.doc', insertText: 'copy_mask_${1:nn----}' },
            ],
        },
    ],

    hovers: {
        'for_range/cube': 'hover.forRangeCube',
        'for_range/cube/pure': 'hover.forRangeCubePure',
        'for_range/line': 'hover.forRangeLine',
        'for_range/line/pure': 'hover.forRangeLinePure',
        'for_range/floodfill': 'hover.forRangeFloodfill',
        'for_range/floodfill/pure': 'hover.forRangeFloodfillPure',
        pure_map: 'hover.pureMap',
        pure_reduce: 'hover.pureReduce',
        call_stack: 'hover.callStack',
        copy_mask_: 'hover.copyMask',
    },

    validators: [
        {
            test: (t) => t.startsWith('copy_mask_') && t.length > 10,
            validate: (t_text) => {
                const m = t_text.slice(10)
                if (!/^[n\-]+$/.test(m)) return { key: 'validation.copyMaskChars', params: { m } }
                return null
            },
        },
    ],
}
