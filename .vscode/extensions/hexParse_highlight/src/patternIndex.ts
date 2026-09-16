// 图案名称索引：读取 runHexDocDump 导出的 JSON（dump_hexbug_patterns.json），
// 按 长ID（完整 id）/ 短ID（id 冒号后半部分）构建两级索引，供 hover / 补全解析图案名称
import * as fs from 'fs'
import { getLocale } from './i18n'

/** dump JSON 中的单个 pattern 对象 */
export interface DumpPattern {
    id: string
    name: Record<string, string>
}

/** 索引条目：dump pattern 对象 + 来源 modid */
export interface PatternEntry {
    id: string
    name: Record<string, string>
    modid: string
}

export interface PatternIndex {
    /** 长名称（完整 id）→ pattern 对象 */
    byId: Map<string, PatternEntry>
    /** 短名称（id 中 ':' 后半部分）→ pattern 对象列表 */
    byShort: Map<string, PatternEntry[]>
    /** 译名索引：lang（如 zh_cn / en_us）→ 译名（小写）→ pattern 对象列表 */
    byName: Map<string, Map<string, PatternEntry[]>>
}

/** 当前 locale 对应的译名表键：en → en_us，其余原样返回 */
export function patternLangKey(): string {
    const locale = getLocale().toLowerCase().replace(/-/g, '_')
    return locale === 'en' ? 'en_us' : locale
}

/** 从多语言名称表中挑选当前语言下的名称，兜底 en_us / 首个值 / id */
export function pickPatternName(entry: PatternEntry): string {
    const name = entry.name ?? {}
    if (name[patternLangKey()]) return name[patternLangKey()]
    if (name.en_us) return name.en_us
    const first = Object.values(name)[0]
    return first ?? entry.id
}

let dumpFile: string | null = null
let cached: { mtimeMs: number; index: PatternIndex } | null = null
let cachedStatus: { mtimeMs: number; remaining: number } | null = null

/** LSP 初始化时设置 dump 文件路径 */
export function initPatternIndex(filePath: string | undefined): void {
    dumpFile = filePath ?? null
    cached = null
    cachedStatus = null
}

/**
 * 读取 dump 中断状态：剩余未导出包数。
 * 状态文件路径 = dump 文件路径去掉 .json 追加 .status.json（与 hexdocDump 写入规则一致）。
 * 无状态文件 / 已完成 → 0。
 */
export function getDumpRemaining(): number {
    if (!dumpFile) return 0
    try {
        const statusPath = dumpFile.replace(/\.json$/, '.status.json')
        const stat = fs.statSync(statusPath)
        if (cachedStatus && cachedStatus.mtimeMs === stat.mtimeMs) return cachedStatus.remaining
        const data = JSON.parse(fs.readFileSync(statusPath, 'utf8')) as { remaining?: number }
        const remaining = typeof data.remaining === 'number' && data.remaining > 0 ? data.remaining : 0
        cachedStatus = { mtimeMs: stat.mtimeMs, remaining }
        return remaining
    } catch {
        return 0
    }
}

function readPatternIndex(filePath: string): PatternIndex {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, DumpPattern[]>
    const byId = new Map<string, PatternEntry>()
    const byShort = new Map<string, PatternEntry[]>()
    const byName = new Map<string, Map<string, PatternEntry[]>>()
    for (const [pkg, patterns] of Object.entries(raw)) {
        if (!Array.isArray(patterns)) continue
        const modid = pkg.startsWith('hexdoc-') ? pkg.slice('hexdoc-'.length) : pkg
        for (const p of patterns) {
            if (!p || typeof p.id !== 'string' || p.id.length === 0) continue
            const entry: PatternEntry = { id: p.id, name: p.name ?? {}, modid }
            const id = p.id.toLowerCase()
            byId.set(id, entry)
            const short = id.includes(':') ? id.slice(id.indexOf(':') + 1) : id
            const list = byShort.get(short)
            if (list) list.push(entry)
            else byShort.set(short, [entry])
            // 译名索引：lang → 译名（小写） → 列表
            for (const [lang, name] of Object.entries(entry.name)) {
                if (!name) continue
                const key = name.toLowerCase()
                let table = byName.get(lang)
                if (!table) {
                    table = new Map()
                    byName.set(lang, table)
                }
                const nameList = table.get(key)
                if (nameList) nameList.push(entry)
                else table.set(key, [entry])
            }
        }
    }
    return { byId, byShort, byName }
}

/**
 * 懒构建 + mtime 缓存：导出/清除导出文件后 mtime 变化，下次访问自动重建。
 * 文件缺失或解析失败返回 null。
 */
export function getPatternIndex(): PatternIndex | null {
    if (!dumpFile) return null
    try {
        const stat = fs.statSync(dumpFile)
        if (cached && cached.mtimeMs === stat.mtimeMs) return cached.index
        const index = readPatternIndex(dumpFile)
        cached = { mtimeMs: stat.mtimeMs, index }
        return index
    } catch {
        return null
    }
}
