// 生成于 GLM-5V-Turbo
import { Position } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'

/** Source: HexParseMod/.../parsers/CodeCutter.kt pTokens */
const RE_WORD = /^[\w./\-:#\u0100-\uffff]+/

export interface Token {
    text: string
    start: Position
    end: Position
}

export function tokenizeLine(line: string, lineNum: number): Token[] {
    const tokens: Token[] = []
    let i = 0
    while (i < line.length) {
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

        // word token — whitelist regex matching Kotlin pTokens
        // / is in the set but must stop before comment starts (/* or //)
        const wordMatch = line.slice(i).match(RE_WORD)
        if (wordMatch) {
            let len = wordMatch[0].length
            // trim trailing / that would start a comment
            if (line[i + len - 1] === '/' && (line[i + len] === '*' || line[i + len] === '/')) len--
            if (len > 0) {
                tokens.push({
                    text: line.slice(i, i + len).replace(/\r$/, ''),
                    start: { line: lineNum, character: i },
                    end: { line: lineNum, character: i + len },
                })
                i += len
            } else {
                i++
            }
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
