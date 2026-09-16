// 生成于 GLM-5V-Turbo
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import { calcLehmer, parseLehmerInput } from './lehmer'
import { runHexDocDump, HEXBUG_PATTERNS_FILE } from './hexdocDump'

let client: LanguageClient

/** 当前进行中的导出控制器，供"中断导出"命令使用 */
let dumpController: AbortController | null = null

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
            dumpFile: path.join(context.globalStoragePath, HEXBUG_PATTERNS_FILE),
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

    // Dump hexdoc pattern data from PyPI into globalStoragePath
    // (VS Code spec: place for storing large amounts of persistent data)
    // Supports resume from settled dump file; interrupt settles to the same file
    context.subscriptions.push(
        vscode.commands.registerCommand('hexparse.dumpHexDocData', async () => {
            if (dumpController) {
                vscode.window.showInformationMessage('HexDoc export is already running.')
                return
            }
            const storageDir = context.globalStoragePath
            fs.mkdirSync(storageDir, { recursive: true })
            const controller = new AbortController()
            dumpController = controller
            await vscode.window.withProgress(
                { location: vscode.ProgressLocation.Notification, title: 'HexParse: exporting hexdoc pattern data' },
                async (progress) => {
                    let last = 0
                    try {
                        const result = await runHexDocDump(storageDir, {
                            signal: controller.signal,
                            onProgress: (done, total) => {
                                progress.report({ message: `${done}/${total}`, increment: done - last })
                                last = done
                            },
                        })
                        if (result.status === 'aborted') {
                            vscode.window.showWarningMessage(
                                `HexDoc export interrupted. ${result.exported}/${result.total} packages settled to ${result.outputPath}`,
                            )
                        } else {
                            vscode.window.showInformationMessage(`HexDoc pattern data written to ${result.outputPath}`)
                        }
                    } catch (err) {
                        const message = err instanceof Error ? err.message : String(err)
                        vscode.window.showErrorMessage(`HexDoc dump failed: ${message}`)
                    } finally {
                        dumpController = null
                    }
                },
            )
        }),
    )

    // Interrupt the running export and settle completed packages
    context.subscriptions.push(
        vscode.commands.registerCommand('hexparse.abortHexDocDump', () => {
            if (dumpController) {
                dumpController.abort()
                vscode.window.showInformationMessage('HexDoc export aborting, settling completed packages...')
            } else {
                vscode.window.showInformationMessage('No HexDoc export is currently running.')
            }
        }),
    )

    // Open the exported hexdoc patterns json
    context.subscriptions.push(
        vscode.commands.registerCommand('hexparse.openHexDocDump', async () => {
            const filePath = path.join(context.globalStoragePath, HEXBUG_PATTERNS_FILE)
            if (!fs.existsSync(filePath)) {
                vscode.window.showWarningMessage(`HexDoc patterns file not found: ${filePath}. Run the export first.`)
                return
            }
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath))
            await vscode.window.showTextDocument(doc, { preview: false })
        }),
    )

    // Clear the exported hexdoc patterns json
    context.subscriptions.push(
        vscode.commands.registerCommand('hexparse.clearHexDocDump', () => {
            const filePath = path.join(context.globalStoragePath, HEXBUG_PATTERNS_FILE)
            if (!fs.existsSync(filePath)) {
                vscode.window.showInformationMessage(`No exported HexDoc data to clear: ${filePath}`)
                return
            }
            fs.unlinkSync(filePath)
            const statusPath = filePath.replace(/\.json$/, '.status.json')
            if (fs.existsSync(statusPath)) fs.unlinkSync(statusPath)
            vscode.window.showInformationMessage(`Cleared exported HexDoc data: ${filePath}`)
        }),
    )
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) return undefined
    return client.stop()
}
