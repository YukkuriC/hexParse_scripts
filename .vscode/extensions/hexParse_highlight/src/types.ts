// 生成于 GLM-5V-Turbo
import { CompletionItemKind } from 'vscode-languageserver/node'

export interface Entry {
    label: string
    kind: CompletionItemKind
    detail?: string
    documentation?: string
    insertText?: string
}

export interface PrefixEntry {
    prefix: string
    entries: Entry[]
}

export interface HoverEntry {
    [key: string]: string
}
