// 图案名称索引：读取 runHexDocDump 导出的 JSON（dump_hexbug_patterns.json），
// 按 长ID（完整 id）/ 短ID（id 冒号后半部分）构建两级索引，供 hover / 补全解析图案名称
import * as fs from 'fs'
import { getLocale } from './i18n'

/** dump JSON 中的单个 pattern 对象 */
export interface DumpPattern {
    id: string
    name: Record<string, string>
    startdir: string
    signature: string
    is_per_world?: boolean
}

/** 索引条目：dump pattern 对象 + 来源 modid */
export interface PatternEntry {
    id: string
    name: Record<string, string>
    modid: string
    startdir: string
    signature: string
    is_per_world?: boolean
}

export interface PatternIndex {
    /** 长名称（完整 id）→ pattern 对象 */
    byId: Map<string, PatternEntry>
    /** 短名称（id 中 ':' 后半部分）→ pattern 对象列表 */
    byShort: Map<string, PatternEntry[]>
    /** 译名索引：lang（如 zh_cn / en_us）→ 译名（小写）→ pattern 对象列表 */
    byName: Map<string, Map<string, PatternEntry[]>>
    /** 原始图案索引：角度串 → pattern 对象列表（HexParse 的 raw 图案固定起始方向 EAST） */
    byRaw: Map<string, PatternEntry[]>
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

// ─── 图案渲染状态 ────────────────────────────────────────────
/** 当前主题普通文本颜色（由扩展宿主通过 LSP 通知传入），仅支持 #rrggbb */
let patternColor = '#d4d4d4'
/** 渲染缓存：entry.id → base64 data URI（惰性求值） */
const renderCache = new Map<string, string>()

/** LSP 初始化时设置 dump 文件路径 */
export function initPatternIndex(filePath: string | undefined): void {
    dumpFile = filePath ?? null
    cached = null
    cachedStatus = null
    renderCache.clear()
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
    const byRaw = new Map<string, PatternEntry[]>()
    for (const [pkg, patterns] of Object.entries(raw)) {
        if (!Array.isArray(patterns)) continue
        const modid = pkg.startsWith('hexdoc-') ? pkg.slice('hexdoc-'.length) : pkg
        for (const p of patterns) {
            if (!p || typeof p.id !== 'string' || p.id.length === 0) continue
            const entry: PatternEntry = {
                id: p.id,
                name: p.name ?? {},
                modid,
                startdir: p.startdir,
                signature: p.signature,
                is_per_world: p.is_per_world === true,
            }
            const id = p.id.toLowerCase()
            byId.set(id, entry)
            const short = id.includes(':') ? id.slice(id.indexOf(':') + 1) : id
            const list = byShort.get(short)
            if (list) list.push(entry)
            else byShort.set(short, [entry])
            // 原始图案索引：角度串（小写）→ 列表
            if (typeof entry.signature === 'string' && entry.signature.length > 0) {
                const sig = entry.signature.toLowerCase()
                const rawList = byRaw.get(sig)
                if (rawList) rawList.push(entry)
                else byRaw.set(sig, [entry])
            }
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
    return { byId, byShort, byName, byRaw }
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
        renderCache.clear()
        return index
    } catch {
        return null
    }
}

// ─── 图案渲染 ─────────────────────────────────────────────────
// 参考 HexMod PatternRenderer.java 的 positions() 语义：
// 起始沿 startdir 画第一笔，每个角度字符 = 一个拐点（方向旋转后继续走），最后补一笔。
// X 长度的 wedsaq 编码 = X 个拐点、(X+1) 个笔画；首字符即第二笔的方向。

/** HexDir 屏幕单位向量（x 右、y 下） */
const DIR_VECS: Record<string, [number, number]> = {
    NORTH_EAST: [0.5, -Math.sqrt(3) / 2],
    EAST: [1, 0],
    SOUTH_EAST: [0.5, Math.sqrt(3) / 2],
    SOUTH_WEST: [-0.5, Math.sqrt(3) / 2],
    WEST: [-1, 0],
    NORTH_WEST: [-0.5, -Math.sqrt(3) / 2],
}

/** 角度字符 → 顺时针偏转角度 */
const ANGLE_DEG: Record<string, number> = { w: 0, e: 60, d: 120, s: 180, a: 240, q: 300 }

/** 向量绕原点顺时针旋转 deg 度（屏幕坐标 y 向下，顺时针为正） */
function rotateDir([x, y]: [number, number], deg: number): [number, number] {
    const rad = (deg * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return [x * cos - y * sin, x * sin + y * cos]
}

/**
 * 由 startdir + 角度串计算拐点坐标序列（网格边长 1，与 positions() 一致）。
 * 语义：首笔沿 startdir 前进；每读一个角度字符 = 一个拐点（先按当前方向前进一笔，再旋转方向），
 * 最后补最后一笔。X 个字符 = X 个拐点、(X+1) 个笔画。
 * 非法 startdir / 角度字符返回 null。
 */
function patternPoints(startdir: string, signature: string): [number, number][] | null {
    const start = DIR_VECS[startdir]
    if (!start || typeof signature !== 'string' || signature.length === 0) return null
    const pts: [number, number][] = [[0, 0]]
    let dir = start
    for (const ch of signature) {
        const deg = ANGLE_DEG[ch]
        if (deg === undefined) return null
        const last = pts[pts.length - 1]
        pts.push([last[0] + dir[0], last[1] + dir[1]]) // 沿当前方向前进一笔
        dir = rotateDir(dir, deg) // 拐点：旋转方向（首字符决定第二笔方向）
    }
    // 补最后一笔（X 个拐点 → X+1 个笔画）
    const last = pts[pts.length - 1]
    pts.push([last[0] + dir[0], last[1] + dir[1]])
    return pts
}

/** 第 i 笔（pts[i]→pts[i+1]）的线段向量 */
function segVec(pts: [number, number][], i: number): [number, number] {
    return [pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]]
}

/** SVG 路径命令（仅折线：M 起点 / L 连线） */
interface PathCmd {
    t: 'M' | 'L'
    p: [number, number]
}

/**
 * 构建 SVG path 命令：
 * - per_world：不绘制拐点，所有笔画按位置去重（无序端点对）后整段画出，长度占网格 100%
 * - 普通：每笔只画居中 80% 的直线主体，拐点前后 10% 以折线直连
 */
function buildPathCommands(pts: [number, number][], perWorld: boolean): PathCmd[] | null {
    const segCount = pts.length - 1
    if (segCount <= 0) return null

    if (perWorld) {
        // 按无序端点对去重：key = 排序后的坐标对
        const seen = new Set<string>()
        const cmds: PathCmd[] = []
        for (let i = 0; i < segCount; i++) {
            const a = pts[i]
            const b = pts[i + 1]
            const key = a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])
                ? `${a[0]},${a[1]}|${b[0]},${b[1]}`
                : `${b[0]},${b[1]}|${a[0]},${a[1]}`
            if (seen.has(key)) continue
            seen.add(key)
            if (cmds.length === 0) cmds.push({ t: 'M', p: a })
            cmds.push({ t: 'L', p: b })
        }
        return cmds.length > 0 ? cmds : null
    }

    // 普通：每笔居中 80%，拐点前后 10% 折线直连
    const cmds: PathCmd[] = []
    const strokeStart = (i: number): [number, number] => {
        const v = segVec(pts, i)
        return [pts[i][0] + 0.1 * v[0], pts[i][1] + 0.1 * v[1]]
    }
    const strokeEnd = (i: number): [number, number] => {
        const v = segVec(pts, i)
        return [pts[i][0] + 0.9 * v[0], pts[i][1] + 0.9 * v[1]]
    }

    cmds.push({ t: 'M', p: strokeStart(0) })
    for (let i = 0; i < segCount; i++) {
        cmds.push({ t: 'L', p: strokeEnd(i) }) // 第 i 笔直线主体（居中 80%）
        if (i + 1 >= segCount) break
        cmds.push({ t: 'L', p: strokeStart(i + 1) }) // 拐点：折线直连
    }

    return cmds
}

/**
 * 计算缩放与平移：bbox 覆盖所有拐点与命令端点，缩放到 20×20 并居中到 24×24
 * （四周各留 2px 白边，避免描边被裁切）。
 */
function fitScale(pts: [number, number][], cmds: PathCmd[]): { scale: number; ox: number; oy: number } {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    const span = (x: number, y: number) => {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
    }
    for (const p of pts) span(p[0], p[1])
    for (const c of cmds) span(c.p[0], c.p[1])
    const bw = maxX - minX
    const bh = maxY - minY
    if (bw === 0 && bh === 0) return { scale: 1, ox: 12, oy: 12 }
    const scale = Math.min(20 / (bw || 1e-9), 20 / (bh || 1e-9))
    const ox = (24 - (maxX + minX) * scale) / 2
    const oy = (24 - (maxY + minY) * scale) / 2
    return { scale, ox, oy }
}

/** 数字格式化：四舍五入保留两位 */
function fmt(n: number): string {
    return (Math.round(n * 100) / 100).toString()
}

/** 命令序列 → SVG path d 串 */
function serializePath(cmds: PathCmd[], scale: number, ox: number, oy: number): string {
    const tx = (x: number) => fmt(x * scale + ox)
    const ty = (y: number) => fmt(y * scale + oy)
    return cmds.map((c) => `${c.t}${tx(c.p[0])},${ty(c.p[1])}`).join(' ')
}

/** 设置主题普通文本颜色（#rrggbb）；变化时清空渲染缓存 */
export function setPatternColor(color: string): void {
    if (color === patternColor) return
    patternColor = color
    renderCache.clear()
}

function renderPatternUri(entry: PatternEntry): string | null {
    const pts = patternPoints(entry.startdir, entry.signature)
    if (!pts) return null
    const cmds = buildPathCommands(pts, entry.is_per_world === true)
    if (!cmds) return null
    const { scale, ox, oy } = fitScale(pts, cmds)
    const d = serializePath(cmds, scale, ox, oy)
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">` +
        `<path d="${d}" fill="none" stroke="${patternColor}" stroke-width="2"/>` +
        `</svg>`
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * 惰性求值获取图案图片（base64 data URI）。
 * 默认按 entry.id 缓存；cache=false 时不缓存（用于 raw 图案，id 为合成的 'raw:'+sig）。
 * 无 startdir/signature 返回 null。
 */
export function getPatternImage(entry: PatternEntry, opts?: { cache?: boolean }): string | null {
    if (typeof entry.startdir !== 'string' || entry.startdir.length === 0) return null
    if (typeof entry.signature !== 'string' || entry.signature.length === 0) return null
    if (opts?.cache !== false) {
        const hit = renderCache.get(entry.id)
        if (hit) return hit
    }
    const uri = renderPatternUri(entry)
    if (uri === null) return null
    if (opts?.cache !== false) renderCache.set(entry.id, uri)
    return uri
}

/**
 * 按角度串解析原始图案（HexParse raw 图案固定起始方向 EAST，直接作为键）。
 * 优先取 startdir === 'EAST' 的条目，否则取列表首个。
 */
export function resolveRawPattern(signature: string): PatternEntry | null {
    const index = getPatternIndex()
    if (!index) return null
    const list = index.byRaw.get(signature.toLowerCase())
    if (!list || list.length === 0) return null
    return list.find((e) => e.startdir === 'EAST') ?? list[0]
}
