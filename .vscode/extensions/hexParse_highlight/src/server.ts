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
import { initPatternIndex, setPatternGradient, setPerWorldColor } from './patternIndex'
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

    // Locate the hexdoc dump file (written by hexparse.dumpHexDocData)
    initPatternIndex(params.initializationOptions?.dumpFile as string | undefined)

    // Pattern stroke gradient list from configuration (host resolves 'theme' beforehand)
    setPatternGradient(params.initializationOptions?.patternGradient)
    setPerWorldColor(params.initializationOptions?.perWorldColor)

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
    return buildCompletionItems(token?.text ?? '', token)
})

connection.onCompletionResolve((item) => item)

// 扩展宿主在配置变化时推送（已解析）笔画渐变色列表
connection.onNotification('hexparse/patternGradient', (colors) => {
    setPatternGradient(colors)
})

// 扩展宿主在配置变化时推送卓越图案覆盖颜色
connection.onNotification('hexparse/perWorldColor', (color) => {
    setPerWorldColor(color)
})

// ─── Completion Handler ───────────────────────────────────────────

connection.onHover((textDocumentPosition) => handleHover(textDocumentPosition, documents))

// ─── Diagnostics / Validation ────────────────────────────────

documents.onDidChangeContent((change) => {
    const diags = validateDoc(change.document)
    connection.sendDiagnostics({ uri: change.document.uri, diagnostics: diags })
})

// ─── Lifecycle ───────────────────────────────────────────────

documents.listen(connection)
connection.listen()
