// 生成于 GLM-5V-Turbo
import { Position, Range } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { connection } from './server'

export interface Token {
    text: string
    start: Position
    end: Position
}

export function tokenizeLine(line: string, lineNum: number): Token[] {
    const tokens: Token[] = []
    let i = 0
    while (i < line.length) {
        // skip whitespace
        if (line[i] === ' ' || line[i] === '\t') {
            i++
            continue
        }

        // ── Layer 1: Comments (highest priority) ──

        // block comment → consume until */ or end of line
        if (line[i] === '/' && line[i + 1] === '*') {
            let j = i + 2
            while (j < line.length && !(line[j] === '*' && line[j + 1] === '/')) j++
            j = Math.min(j + 2, line.length)
            tokens.push({
                text: line.slice(i, j).replace(/\r$/, ''),
                start: { line: lineNum, character: i },
                end: { line: lineNum, character: j },
            })
            i = j
            continue
        }
        // line comment → rest is comment
        if (line[i] === '/' && line[i + 1] === '/') {
            tokens.push({
                text: line.slice(i).replace(/\r$/, ''),
                start: { line: lineNum, character: i },
                end: { line: lineNum, character: line.length },
            })
            break
        }

        // ── Layer 2: Structural ──

        // quoted string
        if (line[i] === '"') {
            let j = i + 1
            while (j < line.length && line[j] !== '"') {
                if (line[j] === '\\') j++
                j++
            }
            j = Math.min(j + 1, line.length)
            tokens.push({
                text: line.slice(i, j).replace(/\r$/, ''),
                start: { line: lineNum, character: i },
                end: { line: lineNum, character: j },
            })
            i = j
            continue
        }
        // structural chars
        if ('[(){}]'.includes(line[i])) {
            tokens.push({
                text: line[i],
                start: { line: lineNum, character: i },
                end: { line: lineNum, character: i + 1 },
            })
            i++
            continue
        }
        // escape char
        if (line[i] === '\\') {
            tokens.push({
                text: '\\',
                start: { line: lineNum, character: i },
                end: { line: lineNum, character: i + 1 },
            })
            i++
            continue
        }

        // ── Layer 3: Code content (lowest priority) ──

        // word token (identifier / pattern) — stops at delimiters
        // / only splits when followed by * or / (block/line comment start)
        let j = i
        while (j < line.length && !' \t,[(\\){}]'.includes(line[j])) {
            if (line[j] === '/' && (line[j + 1] === '*' || line[j + 1] === '/')) break
            j++
        }
        if (j > i) {
            tokens.push({
                text: line.slice(i, j).replace(/\r$/, ''), // strip trailing CR on Windows
                start: { line: lineNum, character: i },
                end: { line: lineNum, character: j },
            })
            i = j
        } else {
            i++
        }
    }
    return tokens
}

export function getTokenAt(doc: TextDocument, pos: Position): Token | null {
    const startOffset = doc.offsetAt({ line: pos.line, character: 0 })
    const endOffset = pos.line + 1 < doc.lineCount
        ? doc.offsetAt({ line: pos.line + 1, character: 0 })
        : doc.getText().length
    const lineText = doc.getText().substring(startOffset, endOffset).replace(/\r?\n$/, '')
    const tokens = tokenizeLine(lineText, pos.line)
    for (const t of tokens) {
        if (pos.line === t.start.line && pos.character >= t.start.character && pos.character <= t.end.character)
            return t
    }
    return null
}
