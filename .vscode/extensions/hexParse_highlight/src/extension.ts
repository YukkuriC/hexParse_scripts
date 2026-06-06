// 生成于 GLM-5V-Turbo
import * as vscode from 'vscode'
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'

let client: LanguageClient

export function activate(context: vscode.ExtensionContext): void {
    const serverModule = context.asAbsolutePath('out/server.js')

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
    }

    client = new LanguageClient('hexparseServer', 'HexParse Language Server', serverOptions, clientOptions)

    client.start()
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) return undefined
    return client.stop()
}
