// 移植自 PyPI hexdoc 数据导出脚本（hexbug-dump）
// 从 PyPI 拉取 HexBug-data 的 hexdoc-* 依赖 wheel，提取图案与多语言名称
// 输出写入扩展宿主指定的 HexParse 持久化目录（globalStorage 上一级，规避编辑器对扩展 globalStorage 的清理）
import * as https from 'https'
import * as vscode from 'vscode'
import AdmZip from 'adm-zip'

const PYPI_JSON_URL = (pkg: string): string => `https://pypi.org/pypi/${pkg}/json`

/** 导出文件名（中断结算与完整导出写同一文件） */
export const HEXBUG_PATTERNS_FILE = 'dump_hexbug_patterns.json'
/** 状态文件名（剩余未导出包数；与 server 端规则一致） */
export const HEXBUG_PATTERNS_STATUS_FILE = HEXBUG_PATTERNS_FILE.replace(/\.json$/, '.status.json')

interface HexDocPattern {
    id: string
    name: Record<string, string>
}

/** patchouli 条目中的图案页面引用：op_id → 页面（entry 为相对 entries/ 的路径，含子目录，如 patterns/meta） */
interface PatchouliPageRef {
    op_id: string
    entry: string
    anchor: string
}

/** 单个包导出的完整数据：图案 + patchouli 页面索引 + 书主页基址 */
interface HexDocPackageDump {
    book_url?: string
    patterns: HexDocPattern[]
    pages: PatchouliPageRef[]
}

interface WheelInfo {
    url: string
    version: string
}

export interface DumpOptions {
    /** 每成功导出一个包后回调：done 为本次已导出的包数，total 为剩余待导出包数 */
    onProgress?: (done: number, total: number) => void
    /** 中断信号：置位后停止导出并结算已完成部分 */
    signal?: AbortSignal
}

export type DumpStatus = 'completed' | 'aborted'

export interface DumpResult {
    outputPath: string
    status: DumpStatus
    /** 本次实际导出的包数 */
    exported: number
    /** 本次目标（剩余待导出）包数 */
    total: number
}

function fetchJson(url: string, signal?: AbortSignal): Promise<any> {
    return new Promise((resolve, reject) => {
        https
            .get(url, { headers: { 'User-Agent': 'hexbug-dump/1.0' }, signal }, (res) => {
                const statusCode = res.statusCode ?? 0
                if (statusCode === 404) {
                    res.resume()
                    return reject(new Error(`Not found: ${url}`))
                }
                const location = res.headers.location
                if (statusCode >= 300 && statusCode < 400 && typeof location === 'string') {
                    res.resume()
                    return fetchJson(location, signal).then(resolve, reject)
                }
                if (statusCode !== 200) {
                    res.resume()
                    return reject(new Error(`HTTP ${statusCode} for ${url}`))
                }
                const chunks: Buffer[] = []
                res.on('data', (c) => chunks.push(c))
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')))
                    } catch (e) {
                        reject(e)
                    }
                })
            })
            .on('error', reject)
    })
}

function fetchBuffer(url: string, signal?: AbortSignal): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https
            .get(url, { headers: { 'User-Agent': 'hexbug-dump/1.0' }, signal }, (res) => {
                const statusCode = res.statusCode ?? 0
                const location = res.headers.location
                if (statusCode >= 300 && statusCode < 400 && typeof location === 'string') {
                    res.resume()
                    return fetchBuffer(location, signal).then(resolve, reject)
                }
                if (statusCode !== 200) {
                    res.resume()
                    return reject(new Error(`HTTP ${statusCode} for ${url}`))
                }
                const chunks: Buffer[] = []
                res.on('data', (c) => chunks.push(c))
                res.on('end', () => resolve(Buffer.concat(chunks)))
            })
            .on('error', reject)
    })
}

async function getPackageInfo(packageName: string, signal?: AbortSignal): Promise<any> {
    try {
        return await fetchJson(PYPI_JSON_URL(packageName), signal)
    } catch (e) {
        if (signal?.aborted) throw e
        throw new Error(`Error: package '${packageName}' not found on PyPI`)
    }
}

function parseReqName(reqStr: string): string | null {
    // PEP 508: name [extras] [version spec] [; marker]
    const m = reqStr.match(/^\s*([A-Za-z0-9._-]+)/)
    return m ? m[1].toLowerCase() : null
}

function findHexDocDeps(requires: string[]): Array<[string, string]> {
    const result: Array<[string, string]> = []
    for (const reqStr of requires) {
        const name = parseReqName(reqStr)
        if (!name) continue
        if (name.startsWith('hexdoc-')) result.push([name, reqStr])
    }
    return result
}

async function getLatestWhlUrl(packageName: string, signal?: AbortSignal): Promise<WheelInfo> {
    const data = await getPackageInfo(packageName, signal)
    const version = data.info.version
    const urls = data.urls || []
    for (const f of urls) {
        if (f.packagetype === 'bdist_wheel') return { url: f.url, version }
    }
    throw new Error(`Error: no wheel found for ${packageName} ${version}`)
}

function loadPatterns(zip: AdmZip, modpostfix: string): any | null {
    const entryPath = `hexdoc_${modpostfix}/_export/generated/${modpostfix}.patterns.hexdoc.json`
    const entry = zip.getEntry(entryPath)
    if (!entry) return null
    return JSON.parse(entry.getData().toString('utf-8'))
}

function langFromTail(tail: string): string | null {
    if (tail.endsWith('.json') && !tail.slice(0, -5).includes('.')) {
        const v = tail.slice(0, -5)
        return v || null
    }
    if (tail.endsWith('.json5')) {
        const body = tail.slice(0, -6)
        if (body.includes('.')) {
            const first = body.split('.', 1)[0]
            return first || null
        }
        return body || null
    }
    return null
}

function loadLangFiles(zip: AdmZip, modpostfix: string): Record<string, Record<string, string>> {
    const marker = `hexdoc_${modpostfix}/_export/generated/assets/`
    const result: Record<string, Record<string, string>> = {}
    for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue
        const name = entry.entryName
        if (!name.startsWith(marker)) continue
        const rest = name.slice(marker.length)
        const parts = rest.split('/')
        if (parts.length < 3 || parts[1] !== 'lang') continue
        const tail = parts.slice(2).join('/')

        const lang = langFromTail(tail)
        if (!lang) continue
        let data: any
        try {
            data = JSON.parse(entry.getData().toString('utf-8'))
        } catch {
            continue
        }
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            result[lang] = Object.assign(result[lang] || {}, data)
        }
    }
    return result
}

/** 读取包内 <modid>.hexdoc.json 的 book_url（线上书基址，含版本路径） */
function loadBookUrl(zip: AdmZip, modpostfix: string): string | null {
    const marker = `hexdoc_${modpostfix}/_export/generated/`
    for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue
        const name = entry.entryName
        if (!name.startsWith(marker)) continue
        const rest = name.slice(marker.length)
        if (rest.includes('/') || !rest.endsWith('.hexdoc.json')) continue
        try {
            const data = JSON.parse(entry.getData().toString('utf-8'))
            if (typeof data?.book_url === 'string' && data.book_url.length > 0) return data.book_url
        } catch {
            // 解析失败视为无 book_url
        }
        return null
    }
    return null
}

/**
 * 提取 patchouli 页面反向索引：路径固定为
 * hexdoc_<mod>/_export/generated/assets/hexcasting/patchouli_books/thehexbook/<lang>/entries/<...>.json
 * 条目可为任意子目录深度（如 patterns/meta.json）；各语言目录下条目结构一致，按条目路径去重。
 * entry 为相对 entries/ 的路径（去 .json 后缀、保留子目录），对应 hexdoc 线上链接的 #<entry>@<anchor>。
 */
function loadPatchouliPages(zip: AdmZip, modpostfix: string): PatchouliPageRef[] {
    const marker = `hexdoc_${modpostfix}/_export/generated/assets/hexcasting/patchouli_books/thehexbook/`
    const result: PatchouliPageRef[] = []
    const seen = new Set<string>()
    for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue
        const name = entry.entryName
        if (!name.startsWith(marker)) continue
        const parts = name.slice(marker.length).split('/')
        if (parts.length < 3 || parts[1] !== 'entries') continue
        const tail = parts.slice(2).join('/')
        if (!tail.endsWith('.json')) continue
        const entryPath = tail.slice(0, -5)
        if (seen.has(entryPath)) continue
        seen.add(entryPath)
        let data: any
        try {
            data = JSON.parse(entry.getData().toString('utf-8'))
        } catch {
            continue
        }
        if (!data || typeof data !== 'object' || !Array.isArray(data.pages)) continue
        for (const page of data.pages) {
            if (!page || typeof page !== 'object') continue
            const opId = page.op_id
            if (typeof opId !== 'string' || opId.length === 0) continue
            const anchor = typeof page.anchor === 'string' && page.anchor.length > 0 ? page.anchor : opId
            result.push({ op_id: opId, entry: entryPath, anchor })
        }
    }
    return result
}

async function processHexDocPackage(packageName: string, signal?: AbortSignal): Promise<HexDocPackageDump> {
    const postfix = packageName.slice('hexdoc-'.length)
    const modpostfix = postfix.replace(/-/g, '_')
    console.log(`\n=== ${packageName} (postfix: ${postfix}, module: ${modpostfix}) ===`)

    const { url, version } = await getLatestWhlUrl(packageName, signal)
    console.log(`Latest version: ${version}`)
    console.log(`Downloading wheel: ${url}`)
    const whlBytes = await fetchBuffer(url, signal)

    const zip = new AdmZip(whlBytes)

    const patternsData = loadPatterns(zip, modpostfix)
    if (!patternsData) {
        console.log('  patterns file not found, skipping')
        return { patterns: [], pages: [] }
    }

    const patterns: HexDocPattern[] = patternsData.patterns || []
    console.log(`  Loaded ${patterns.length} patterns`)

    const langs = loadLangFiles(zip, modpostfix)
    console.log(`  Loaded ${Object.keys(langs).length} lang files: ${JSON.stringify(Object.keys(langs).sort())}`)

    for (const pattern of patterns) {
        pattern.name = {}
        const pid = pattern.id
        const key = `hexcasting.action.${pid}`
        for (const [lang, table] of Object.entries(langs)) {
            if (Object.prototype.hasOwnProperty.call(table, key)) {
                pattern.name[lang] = table[key]
            }
        }
    }

    const pages = loadPatchouliPages(zip, modpostfix)
    console.log(`  Loaded ${pages.length} patchouli page refs`)

    const bookUrl = loadBookUrl(zip, modpostfix)
    console.log(`  book_url: ${bookUrl ?? '(none)'}`)

    return { book_url: bookUrl ?? undefined, patterns, pages }
}

/**
 * 断点续传完整性校验：patterns 与 pages 两部分数据缺一不可，缺任意一部分视为需要重新获取。
 */
function isCompletePackageDump(v: unknown): v is HexDocPackageDump {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return false
    const o = v as Record<string, unknown>
    return Array.isArray(o.patterns) && Array.isArray(o.pages)
}

/**
 * 断点续传：解析已有导出文件中的完整包；解析失败则自动清除该文件（等价于"清除已导出内容"）。
 * 单个包数据不完整（缺 patterns 或 pages）时不视为已导出，由 runHexDocDump 重新获取。
 */
async function loadExistingDump(outputPath: vscode.Uri): Promise<Record<string, HexDocPackageDump>> {
    let raw: string
    try {
        raw = Buffer.from(await vscode.workspace.fs.readFile(outputPath)).toString('utf8')
    } catch {
        return {}
    }
    try {
        const existing = JSON.parse(raw)
        if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
            const complete = Object.values(existing).filter((v) => isCompletePackageDump(v)).length
            console.log(`Resuming from existing dump: ${complete} complete packages (of ${Object.keys(existing).length} entries)`)
            return existing as Record<string, HexDocPackageDump>
        }
    } catch {
        // fallthrough
    }
    try {
        await vscode.workspace.fs.delete(outputPath)
    } catch {
        // 文件不存在，无需处理
    }
    console.log('Existing dump file unreadable, cleared for full re-export')
    return {}
}

/**
 * 记录/清除中断状态：中断结算后写入剩余未导出包数，供 server 端 hover 提示。
 * 状态文件路径 = 导出文件路径去掉 .json 追加 .status.json（与 server 端规则一致）。
 */
async function writeDumpStatus(outputPath: vscode.Uri, remaining: number): Promise<void> {
    const statusPath = outputPath.with({ path: outputPath.path.replace(/\.json$/, '.status.json') })
    if (remaining > 0) {
        await vscode.workspace.fs.writeFile(statusPath, Buffer.from(JSON.stringify({ remaining }), 'utf-8'))
    } else {
        try {
            await vscode.workspace.fs.delete(statusPath)
        } catch {
            // 状态文件不存在，无需处理
        }
    }
}

/**
 * 拉取 HexBug-data 及其 hexdoc-* 依赖的图案数据，写入 outputDir/dump_hexbug_patterns.json。
 * 中断时结算已完成部分到同一文件；断点续传跳过已导出的完整包。
 * @param outputDir 输出目录（HexParse 持久化目录）
 */
export async function runHexDocDump(outputDir: vscode.Uri, options: DumpOptions = {}): Promise<DumpResult> {
    const { onProgress, signal } = options
    const outputPath = vscode.Uri.joinPath(outputDir, HEXBUG_PATTERNS_FILE)
    const packageName = 'HexBug-data'

    // 断点续传：解析已有文件；解析失败自动清除
    const allResults = await loadExistingDump(outputPath)

    console.log(`Fetching metadata for ${packageName} from PyPI...`)
    const data = await getPackageInfo(packageName, signal)

    const info = data.info || {}
    console.log(`Package: ${info.name}`)
    console.log(`Latest version: ${info.version || 'unknown'}`)

    const requires: string[] = info.requires_dist || []
    if (requires.length === 0) {
        console.log('No dependencies found.')
        await writeDumpStatus(outputPath, 0)
        return { outputPath: outputPath.fsPath, status: 'completed', exported: 0, total: 0 }
    }

    const hexDocDeps = findHexDocDeps(requires)
    if (hexDocDeps.length === 0) {
        console.log("No 'hexdoc-' prefixed dependencies found.")
        await writeDumpStatus(outputPath, 0)
        return { outputPath: outputPath.fsPath, status: 'completed', exported: 0, total: 0 }
    }

    // 断点续传：仅重新获取「未导出」或「数据不完整（缺 patterns/pages 任意一部分）」的包
    const pending = hexDocDeps.filter(([name]) => {
        const existing = allResults[name]
        return existing === undefined || !isCompletePackageDump(existing)
    })
    console.log(
        `\nFound ${hexDocDeps.length} 'hexdoc-' prefixed dependencies; ` +
            `${hexDocDeps.length - pending.length} already exported, ${pending.length} pending`,
    )
    if (pending.length === 0) {
        console.log('All packages already exported, nothing to do.')
        await writeDumpStatus(outputPath, 0)
        return { outputPath: outputPath.fsPath, status: 'completed', exported: 0, total: 0 }
    }

    const total = pending.length
    let done = 0
    let aborted = false
    onProgress?.(0, total)

    for (const [name] of pending) {
        if (signal?.aborted) {
            aborted = true
            break
        }
        try {
            allResults[name] = await processHexDocPackage(name, signal)
            done++
        } catch (e) {
            if (signal?.aborted) {
                aborted = true
                break
            }
            const message = e instanceof Error ? e.message : String(e)
            console.log(`  Skipped/Error processing ${name}: ${message}`)
            // 导出失败不保留该包数据，避免旧格式/半截数据被续传误判为完整
            delete allResults[name]
        }
        onProgress?.(done, total)
    }

    // 中断结算与完整导出写同一文件
    await vscode.workspace.fs.createDirectory(outputDir)
    await vscode.workspace.fs.writeFile(outputPath, Buffer.from(JSON.stringify(allResults, null, 2), 'utf-8'))
    console.log(`\nWrote results to ${outputPath.fsPath} (${aborted ? 'interrupted, settled' : 'complete'})`)
    await writeDumpStatus(outputPath, aborted ? total - done : 0)
    return { outputPath: outputPath.fsPath, status: aborted ? 'aborted' : 'completed', exported: done, total }
}
