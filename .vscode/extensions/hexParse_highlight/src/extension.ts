// 生成于 GLM-5V-Turbo
import * as vscode from 'vscode'
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node'
import { calcLehmer, parseLehmerInput } from './lehmer'
import { runHexDocDump, HEXBUG_PATTERNS_FILE, HEXBUG_PATTERNS_STATUS_FILE } from './hexdocDump'

let client: LanguageClient

/** 当前进行中的导出控制器，供"中断导出"命令使用 */
let dumpController: AbortController | null = null

/** 当前主题普通文本颜色（#rrggbb），供图案渲染使用 */
function currentThemeColor(): string {
    const kind = vscode.window.activeColorTheme.kind
    if (kind === vscode.ColorThemeKind.Light) return '#1f1f1f'
    if (kind === vscode.ColorThemeKind.HighContrast) return '#ffffff'
    return '#d4d4d4'
}

/** 当前笔画渐变色列表配置；'theme' 在传入前解析为当前主题色，其余需为 #RGB */
function currentGradient(): string[] {
    const list = vscode.workspace.getConfiguration('hexparse').get<string[]>('patternGradient', ['#ff00ff', 'theme'])
    return list.map((c) => (c === 'theme' ? currentThemeColor() : c))
}

/** 当前卓越图案覆盖色；非法值返回 null（维持渐变色） */
function currentPerWorldColor(): string | null {
    const color = vscode.workspace.getConfiguration('hexparse').get<string>('perWorldColor', '#7f7f7f')
    return typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color : null
}

/**
 * HexParse 持久化目录：globalStorage 上一级的 HexParse 目录。
 * 不用扩展自带 globalStorage 目录，规避编辑器启动时对扩展 globalStorage 的整目录清理。
 */
function hexParseStorageUri(context: vscode.ExtensionContext): vscode.Uri {
    return vscode.Uri.joinPath(context.globalStorageUri, '..', 'HexParse')
}

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
            dumpFile: vscode.Uri.joinPath(hexParseStorageUri(context), HEXBUG_PATTERNS_FILE).fsPath,
            patternGradient: currentGradient(),
            perWorldColor: currentPerWorldColor(),
        },
    }

    client = new LanguageClient('hexparseServer', 'HexParse Language Server', serverOptions, clientOptions)

    client.start()

    // 主题切换时重新解析并推送笔画渐变色列表（'theme' 随主题变化）
    context.subscriptions.push(
        vscode.window.onDidChangeActiveColorTheme(() => {
            client.sendNotification('hexparse/patternGradient', currentGradient())
        }),
    )

    // 渐变色列表 / 卓越覆盖色配置变化时同步到服务端
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('hexparse.patternGradient')) {
                client.sendNotification('hexparse/patternGradient', currentGradient())
            }
            if (e.affectsConfiguration('hexparse.perWorldColor')) {
                client.sendNotification('hexparse/perWorldColor', currentPerWorldColor())
            }
        }),
    )

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

    // Dump hexdoc pattern data from PyPI into the HexParse storage dir
    // (outside globalStorage: the editor wipes the extension globalStorage dir at startup)
    // Supports resume from settled dump file; interrupt settles to the same file
    context.subscriptions.push(
        vscode.commands.registerCommand('hexparse.dumpHexDocData', async () => {
            if (dumpController) {
                vscode.window.showInformationMessage('HexDoc export is already running.')
                return
            }
            const storageDir = hexParseStorageUri(context)
            await vscode.workspace.fs.createDirectory(storageDir)
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
            const fileUri = vscode.Uri.joinPath(hexParseStorageUri(context), HEXBUG_PATTERNS_FILE)
            try {
                await vscode.workspace.fs.stat(fileUri)
            } catch {
                vscode.window.showWarningMessage(`HexDoc patterns file not found: ${fileUri.fsPath}. Run the export first.`)
                return
            }
            const doc = await vscode.workspace.openTextDocument(fileUri)
            await vscode.window.showTextDocument(doc, { preview: false })
        }),
    )

    // Clear the exported hexdoc patterns json
    context.subscriptions.push(
        vscode.commands.registerCommand('hexparse.clearHexDocDump', async () => {
            const fileUri = vscode.Uri.joinPath(hexParseStorageUri(context), HEXBUG_PATTERNS_FILE)
            try {
                await vscode.workspace.fs.stat(fileUri)
            } catch {
                vscode.window.showInformationMessage(`No exported HexDoc data to clear: ${fileUri.fsPath}`)
                return
            }
            await vscode.workspace.fs.delete(fileUri)
            try {
                await vscode.workspace.fs.delete(vscode.Uri.joinPath(hexParseStorageUri(context), HEXBUG_PATTERNS_STATUS_FILE))
            } catch {
                // 状态文件不存在，无需处理
            }
            vscode.window.showInformationMessage(`Cleared exported HexDoc data: ${fileUri.fsPath}`)
        }),
    )
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) return undefined
    return client.stop()
}
