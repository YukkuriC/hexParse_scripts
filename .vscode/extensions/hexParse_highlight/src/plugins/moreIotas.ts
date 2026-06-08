// 生成于 GLM-5V-Turbo
import { PluginDef, ValueExtractor } from '../types'
import { CompletionItemKind, DiagnosticSeverity } from 'vscode-languageserver/node'

// ─── MoreIotas: Matrix & Type References ──────────────────────

const extractMatrix: ValueExtractor = (suffix) => {
    const parts = suffix.split('_').filter(Boolean)
    if (parts.length < 2) return suffix || '(empty)'
    const rows = parseInt(parts[0], 10)
    const cols = parseInt(parts[1], 10)
    const vals = parts.slice(2)
    const total = rows * cols
    // Pad with 0
    const grid: string[] = []
    for (let i = 0; i < total; i++) {
        grid.push(i < vals.length && vals[i] ? vals[i] : '0')
    }
    // Format as plain text rows, \n\n for markdown paragraph break + leading \n for alignment
    const lines: string[] = ['']
    for (let r = 0; r < rows; r++) {
        const row = grid.slice(r * cols, r * cols + cols)
        lines.push(row.join('  '))
    }
    return lines.join('\n\n')
}

export const moreIotasPlugin: PluginDef = {
    name: 'moreIotas',

    prefixes: [
        {
            prefix: 'matrix_',
            entries: [
                { label: 'matrix_', kind: CompletionItemKind.Class, detail: 'plugin.matrix.detail', documentation: 'plugin.matrix.doc', insertText: 'matrix_${1:rows}_${2:cols}_${3:values...}' },
                { label: 'mat_', kind: CompletionItemKind.Class, detail: 'plugin.matrixAlias.detail', documentation: 'plugin.matrixAlias.doc', insertText: 'mat_${1:rows}_${2:cols}_${3:values...}' },
            ],
        },
        {
            prefix: 'type/',
            entries: [
                { label: 'type/iota_', kind: CompletionItemKind.Interface, detail: 'plugin.iotaType.detail', documentation: 'plugin.iotaType.doc', insertText: 'type/iota_${1:id}' },
                { label: 'type/entity_', kind: CompletionItemKind.Interface, detail: 'plugin.entityType.detail', documentation: 'plugin.entityType.doc', insertText: 'type/entity_${1:id}' },
                { label: 'type/item_', kind: CompletionItemKind.Interface, detail: 'plugin.itemType.detail', documentation: 'plugin.itemType.doc', insertText: 'type/item_${1:id}' },
                { label: 'type/block_', kind: CompletionItemKind.Interface, detail: 'plugin.blockType.detail', documentation: 'plugin.blockType.doc', insertText: 'type/block_${1:id}' },
            ],
        },
        {
            prefix: 'str_',
            entries: [
                { label: 'str_', kind: CompletionItemKind.Struct, detail: 'plugin.str.detail', documentation: 'plugin.str.doc', insertText: 'str_${1:content}' },
            ],
        },
    ],

    hovers: {
        matrix_: 'hover.matrix',
        mat_: 'hover.matrixAlias',
        'type/iota_': 'hover.typeRef',
        'type/entity_': 'hover.typeRef',
        'type/item_': 'hover.typeRef',
        'type/block_': 'hover.typeRef',
        str_: 'hover.str',
    },

    valueExtractors: {
        matrix_: extractMatrix,
        mat_: extractMatrix,
    },

    validators: [
        {
            test: (t) => t.startsWith('matrix_') || t.startsWith('mat_'),
            validate: (t_text): { key: string; params: Record<string, string | number> } | null => {
                const prefixLen = t_text.startsWith('matrix_') ? 7 : 4
                const parts = t_text.slice(prefixLen).split('_').filter(Boolean)
                if (parts.length < 2) return null
                const rows = parseInt(parts[0], 10)
                const cols = parseInt(parts[1], 10)
                // Check for non-positive dimensions
                if (isNaN(rows) || rows <= 0) {
                    return { key: 'validation.matrixSize', params: { dim: 'row', value: parts[0] } }
                }
                if (isNaN(cols) || cols <= 0) {
                    return { key: 'validation.matrixSize', params: { dim: 'col', value: parts[1] } }
                }
                // Check data overflow
                const valCount = parts.length - 2
                if (valCount > rows * cols) {
                    return { key: 'validation.matrixOverflow', params: { actual: valCount, expected: rows * cols, rows, cols } }
                }
                return null
            },
            severity: DiagnosticSeverity.Error,
        },
    ],
}
