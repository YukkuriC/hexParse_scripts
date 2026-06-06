// 生成于 GLM-5V-Turbo
import * as vscode from 'vscode'
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import * as nlsEn from '../package.nls.json'
import * as nlsZh from '../package.nls.zh-cn.json'

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
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) return undefined
    return client.stop()
}
