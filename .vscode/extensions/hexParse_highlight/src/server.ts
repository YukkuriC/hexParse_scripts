// 生成于 GLM-5V-Turbo
import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    TextDocumentSyncKind,
    InitializeResult,
} from 'vscode-languageserver/node'

import { TextDocument } from 'vscode-languageserver-textdocument'

import { buildCompletionItems } from './completion'
import { handleHover } from './hover'
import { validateDoc } from './validation'
import { getTokenAt } from './tokenizer'
import { registerBundle, setLocale } from './i18n'
import * as nlsEn from '../package.nls.json'
import * as nlsZh from '../package.nls.zh-cn.json'

// ─── Register locale bundles ─────────────────────────────────

registerBundle('en', nlsEn as unknown as Record<string, string>)
registerBundle('zh-cn', nlsZh as unknown as Record<string, string>)

// ─── Connection & Document Setup ──────────────────────────────

export const connection = createConnection(ProposedFeatures.all)
export const documents = new TextDocuments(TextDocument)

let hasDiagnosticsCapability = false

connection.onInitialize((params: InitializeParams) => {
    const capabilities = params.capabilities
    hasDiagnosticsCapability = !!(capabilities.textDocument && capabilities.textDocument.diagnostic)

    // Set locale from client initialization options (default: en)
    const locale = (params.initializationOptions?.locale as string) || 'en'
    setLocale(locale)

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['_', '#', '/', ':', '.', '\\'],
            },
            hoverProvider: true,
        },
    }
    return result
})

// ─── Completion Handler ──────────────────────────────────────

connection.onCompletion((textDocumentPosition): import('vscode-languageserver/node').CompletionItem[] => {
    const doc = documents.get(textDocumentPosition.textDocument.uri)
    if (!doc) return []

    const token = getTokenAt(doc, textDocumentPosition.position)
    return buildCompletionItems(token?.text ?? '')
})

connection.onCompletionResolve((item) => item)

// ─── Hover Handler ───────────────────────────────────────────

connection.onHover((textDocumentPosition) => handleHover(textDocumentPosition, documents))

// ─── Diagnostics / Validation ────────────────────────────────

documents.onDidChangeContent((change) => {
    const diags = validateDoc(change.document)
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics: diags })
})

// ─── Lifecycle ───────────────────────────────────────────────

documents.listen(connection)
connection.listen()
