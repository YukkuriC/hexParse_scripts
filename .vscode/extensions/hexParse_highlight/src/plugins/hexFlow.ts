// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'

// ─── HexFlow: Meta Patterns & Copy Mask ───────────────────────

export const hexFlowPrefixes: PrefixEntry[] = [
    // ── for_range family ──────────────────────────────────────
    {
        prefix: 'for_range/',
        entries: [
            {
                label: 'for_range/cube',
                kind: 14, // CompletionItemKind.Keyword (meta)
                detail: 'plugin.forRangeCube.detail',
                documentation: 'plugin.forRangeCube.doc',
            },
            {
                label: 'for_range/cube/pure',
                kind: 14,
                detail: 'plugin.forRangeCubePure.detail',
                documentation: 'plugin.forRangeCubePure.doc',
            },
            {
                label: 'for_range/line',
                kind: 14,
                detail: 'plugin.forRangeLine.detail',
                documentation: 'plugin.forRangeLine.doc',
            },
            {
                label: 'for_range/line/pure',
                kind: 14,
                detail: 'plugin.forRangeLinePure.detail',
                documentation: 'plugin.forRangeLinePure.doc',
            },
            {
                label: 'for_range/floodfill',
                kind: 14,
                detail: 'plugin.forRangeFloodfill.detail',
                documentation: 'plugin.forRangeFloodfill.doc',
            },
            {
                label: 'for_range/floodfill/pure',
                kind: 14,
                detail: 'plugin.forRangeFloodfillPure.detail',
                documentation: 'plugin.forRangeFloodfillPure.doc',
            },
        ],
    },
    // ── pure_ family ──────────────────────────────────────────
    {
        prefix: 'pure_',
        entries: [
            {
                label: 'pure_map',
                kind: 14,
                detail: 'plugin.pureMap.detail',
                documentation: 'plugin.pureMap.doc',
            },
            {
                label: 'pure_reduce',
                kind: 14,
                detail: 'plugin.pureReduce.detail',
                documentation: 'plugin.pureReduce.doc',
            },
        ],
    },
    // ── call_stack ───────────────────────────────────────────
    {
        prefix: 'call_stack',
        entries: [
            {
                label: 'call_stack',
                kind: 14,
                detail: 'plugin.callStack.detail',
                documentation: 'plugin.callStack.doc',
            },
        ],
    },
    // ── copy_mask (existing) ──────────────────────────────────
    {
        prefix: 'copy_mask_',
        entries: [
            {
                label: 'copy_mask_',
                kind: 24, // CompletionItemKind.Operator
                detail: 'plugin.copyMask.detail',
                documentation: 'plugin.copyMask.doc',
                insertText: 'copy_mask_${1:nn----}',
            },
        ],
    },
]

export const hexFlowHovers: HoverEntry = {
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
}
