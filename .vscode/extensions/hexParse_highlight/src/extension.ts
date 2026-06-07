// 生成于 GLM-5V-Turbo
import * as vscode from 'vscode'
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import { calcLehmer, parseLehmerInput } from './lehmer'

let client: LanguageClient

export function activate(context: vscode.ExtensionContext): void {
    const serverModule = context.asAbsolutePath('out/server.js')

    // Detect VSCode locale and map to our supported locales
    const vsLocale = vscode.env.language
    const locale = vsLocale.startsWith('zh') ? 'zh-cn' : 'en'

    // Run server in same process via IPC
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: ['--nolazy'] },
        },
    }

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'HexParse' }],
        synchronize: {
            configurationSection: 'hexparse',
        },
        initializationOptions: {
            locale,
        },
    }

    client = new LanguageClient('hexparseServer', 'HexParse Language Server', serverOptions, clientOptions)

    client.start()

    // Register Lehmer Code calculation command
    context.subscriptions.push(
        vscode.commands.registerCommand('hexparse.calculateLehmer', () => {
            const editor = vscode.window.activeTextEditor
            if (!editor) return

            const selection = editor.selection
            const selectedText = editor.document.getText(selection)
            if (!selectedText.trim()) {
                vscode.window.showWarningMessage('No text selected. Select a sequence of numbers to calculate Lehmer code.')
                return
            }

            const orders = parseLehmerInput(selectedText)
            if (!orders) {
                vscode.window.showErrorMessage(`Invalid input: "${selectedText}" is not a valid sequence of integers.`)
                return
            }

            const result = calcLehmer(orders)
            if (result === null) {
                vscode.window.showErrorMessage(`Invalid Lehmer input (empty or exceeds max count of 20).`)
                return
            }

            const template = vscode.workspace.getConfiguration('hexparse').get<string>('lehmerTemplate', '({result})splat,swizzle')
            const replacement = template.replace('{result}', String(result))
            editor.edit((editBuilder) => {
                editBuilder.replace(selection, replacement)
            })
        }),
    )
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) return undefined
    return client.stop()
}
