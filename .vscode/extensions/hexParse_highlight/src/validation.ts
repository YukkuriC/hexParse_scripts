// 生成于 GLM-5V-Turbo
import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { tokenizeLine } from './tokenizer'
import { allValidators } from './plugins'
import { t } from './i18n'

/** Find all block comment ranges in the document for skipping */
function findBlockCommentRanges(text: string): { start: number; end: number }[] {
    const ranges: { start: number; end: number }[] = []
    let i = 0
    while (i < text.length) {
        if (text[i] === '/' && text[i + 1] === '*') {
            const start = i
            i += 2
            while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
            i += 2 // skip */
            ranges.push({ start, end: i })
        } else {
            i++
        }
    }
    return ranges
}

/** Check if a position (char offset) is inside any block comment */
function isInBlockComment(offset: number, commentRanges: { start: number; end: number }[]): boolean {
    return commentRanges.some(r => offset >= r.start && offset < r.end)
}

export function validateDoc(doc: TextDocument): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const text = doc.getText()
    const lines = text.split('\n')
    const blockComments = findBlockCommentRanges(text)

    // Build line-start offset map for position -> charOffset conversion
    const lineOffsets: number[] = []
    let offset = 0
    for (const line of lines) {
        lineOffsets.push(offset)
        offset += line.length + 1 // +1 for \n
    }

    function posToOffset(pos: Position): number {
        return (lineOffsets[pos.line] ?? 0) + pos.character
    }

    // ── Token-level validation (table-driven via plugin validators) ──
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum]
        const tokens = tokenizeLine(line, lineNum)

        for (const tok of tokens) {
            // Skip validation inside block comments
            if (isInBlockComment(posToOffset(tok.start), blockComments)) continue

            // Dispatch to all registered plugin validators
            for (const v of allValidators) {
                if (!v.test(tok.text)) continue
                const result = v.validate(tok.text)
                if (result) {
                    diagnostics.push({
                        severity: v.severity ?? DiagnosticSeverity.Error,
                        range: Range.create(tok.start, tok.end),
                        message: t(result.key, result.params),
                        source: 'hexparse',
                    })
                }
            }
        }
    }

    // ── Document-level bracket balance check (cross-line aware, skips block comments) ──
    let depthSq = 0
    let depthGroup = 0
    const sqOpenStack: Position[] = [] // track [ positions for precise error
    const groupOpenStack: Position[] = // track ( or { positions
        []

    for (let ci = 0; ci < text.length; ci++) {
        // Skip block comment content entirely
        if (isInBlockComment(ci, blockComments)) continue

        const ch = text[ci]
        if (ch === '[') {
            depthSq++
            sqOpenStack.push(offsetToPos(ci))
        } else if (ch === ']') {
            depthSq--
            if (sqOpenStack.length > 0) sqOpenStack.pop()
        } else if (ch === '(' || ch === '{') {
            depthGroup++
            groupOpenStack.push(offsetToPos(ci))
        } else if (ch === ')' || ch === '}') {
            depthGroup--
            if (groupOpenStack.length > 0) groupOpenStack.pop()
        }
    }

    /** Convert character offset to Position */
    function offsetToPos(off: number): Position {
        // binary search for the line
        let lo = 0,
            hi = lineOffsets.length - 1
        while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2)
            if (lineOffsets[mid] <= off) lo = mid
            else hi = mid - 1
        }
        return { line: lo, character: off - lineOffsets[lo] }
    }

    // Report unmatched brackets at document level
    if (sqOpenStack.length > 0 || depthSq > 0) {
        const pos = sqOpenStack.length > 0 ? sqOpenStack[sqOpenStack.length - 1] : offsetToPos(text.length - 1)
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: Range.create(pos, { line: pos.line, character: pos.character + 1 }),
            message: t('validation.unmatchedSqOpen'),
            source: 'hexparse',
        })
    }
    if (depthSq < 0) {
        const lastLine = lines.length - 1
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: Range.create(lastLine, 0, lastLine, Math.max(lines[lastLine].length, 1)),
            message: t('validation.unmatchedSqClose'),
            source: 'hexparse',
        })
    }
    if (groupOpenStack.length > 0 || depthGroup > 0) {
        const pos = groupOpenStack.length > 0 ? groupOpenStack[groupOpenStack.length - 1] : offsetToPos(text.length - 1)
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: Range.create(pos, { line: pos.line, character: pos.character + 1 }),
            message: t('validation.unmatchedGroupOpen'),
            source: 'hexparse',
        })
    }
    if (depthGroup < 0) {
        const lastLine = lines.length - 1
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: Range.create(lastLine, 0, lastLine, Math.max(lines[lastLine].length, 1)),
            message: t('validation.unmatchedGroupClose'),
            source: 'hexparse',
        })
    }

    return diagnostics
}
