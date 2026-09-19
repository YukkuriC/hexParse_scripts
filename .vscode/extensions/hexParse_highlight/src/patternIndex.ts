// 图案名称索引：读取 runHexDocDump 导出的 JSON（dump_hexbug_patterns.json），
// 按 长ID（完整 id）/ 短ID（id 冒号后半部分）构建两级索引，供 hover / 补全解析图案名称
import * as fs from 'fs'
import { getLocale, tr } from './i18n'
import { defaultConfigs, defaultThemeColor, isHexColor, resolveThemeOr } from './color'

/** dump JSON 中的单个 pattern 对象 */
export interface DumpPattern {
    id: string
    name: Record<string, string>
    startdir: string
    signature: string
    is_per_world?: boolean
}

/** dump JSON 中 patchouli 页面引用：op_id → 页面（entry 为相对 entries/ 的路径，含子目录，如 patterns/meta） */
interface PatchouliPageRef {
    op_id: string
    entry: string
    anchor: string
}

/** dump JSON 中单个包的数据（兼容旧格式：值直接为图案数组，无链接数据） */
interface PackageDump {
    book_url?: string
    patterns?: DumpPattern[]
    pages?: PatchouliPageRef[]
}

/** 索引条目：dump pattern 对象 + 来源 modid + hexdoc 链接 */
export interface PatternEntry {
    id: string
    name: Record<string, string>
    modid: string
    startdir: string
    signature: string
    is_per_world?: boolean
    /** hexdoc 图案页面链接（图案名链接）；无可用数据时不设置 */
    pageUrl?: string
    /** hexdoc 书主页链接（mod 名链接）；无可用数据时不设置 */
    modUrl?: string
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
/** 渲染缓存：entry.id → base64 data URI（惰性求值，hover 与补全共用） */
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
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>
    const byId = new Map<string, PatternEntry>()
    const byShort = new Map<string, PatternEntry[]>()
    const byName = new Map<string, Map<string, PatternEntry[]>>()
    const byRaw = new Map<string, PatternEntry[]>()
    for (const [pkg, rawVal] of Object.entries(raw)) {
        // 兼容旧格式：值直接为图案数组（无链接数据）；新格式：{ book_url?, patterns, pages }
        const dump = rawVal as PackageDump
        const patterns = Array.isArray(rawVal) ? (rawVal as DumpPattern[]) : Array.isArray(dump.patterns) ? dump.patterns : null
        if (!patterns) continue
        const modid = pkg.startsWith('hexdoc-') ? pkg.slice('hexdoc-'.length) : pkg
        const bookUrl = normalizeBookUrl(dump.book_url)
        // 本包页面索引：op_id（小写）→ 页面引用列表
        const pagesByOp = new Map<string, PatchouliPageRef[]>()
        if (Array.isArray(dump.pages)) {
            for (const page of dump.pages) {
                if (!page || typeof page.op_id !== 'string' || page.op_id.length === 0) continue
                const key = page.op_id.toLowerCase()
                const list = pagesByOp.get(key)
                if (list) list.push(page)
                else pagesByOp.set(key, [page])
            }
        }
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
            // 图案页面链接：取本包索引中首个页面引用；book_url 缺失或未命中时留空
            if (bookUrl) {
                const refs = pagesByOp.get(id)
                if (refs && refs.length > 0) {
                    const r = refs[0]
                    entry.pageUrl = `${bookUrl}#${r.entry}@${r.anchor}`
                }
                entry.modUrl = bookUrl
            }
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

/** SVG 路径命令（仅折线：M 起点 / L 连线） */
interface PathCmd {
    t: 'M' | 'L'
    p: [number, number]
}

/**
 * 计算缩放与平移：bbox 覆盖所有拐点与命令端点，缩放到 content×content 并居中到 canvas×canvas
 * （四周留白，避免描边被裁切）。
 */
function fitScale(pts: [number, number][], cmds: PathCmd[], content = 20, canvas = 24): { scale: number; ox: number; oy: number } {
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
    if (bw === 0 && bh === 0) return { scale: 1, ox: canvas / 2, oy: canvas / 2 }
    const scale = Math.min(content / (bw || 1e-9), content / (bh || 1e-9))
    const ox = (canvas - (maxX + minX) * scale) / 2
    const oy = (canvas - (maxY + minY) * scale) / 2
    return { scale, ox, oy }
}

/** 数字格式化：四舍五入保留两位 */
function fmt(n: number): string {
    return (Math.round(n * 100) / 100).toString()
}

/** 图案渲染参数：内容区大小、画布大小（含留白）、笔触宽度 */
interface RenderOptions {
    /** 图案内容区边长（px） */
    content: number
    /** 画布边长（px）= 内容区 + 留白 */
    canvas: number
    /** 笔触宽度（px） */
    strokeWidth: number
}

/** 图案渲染：100px 内容 + 8px 留白，4px 笔触，逐笔画渐变（hover 与补全共用） */
const PATTERN_RENDER: RenderOptions = { content: 100, canvas: 108, strokeWidth: 4 }

/** 图案笔画渐变色列表（宿主已解析为具体 #rrggbb），从首笔到末笔依次插值 */
let gradientColors: string[] = defaultConfigs.patternGradient.map((c) => resolveThemeOr(c, defaultThemeColor))

/** 卓越（per_world）图案覆盖颜色；null 表示无覆盖（维持渐变色） */
let perWorldColor: string | null = defaultConfigs.perWorldColor

/** 设置卓越图案覆盖颜色；仅接受 #rrggbb，非法值视为无覆盖 */
export function setPerWorldColor(color: unknown): void {
    const valid = isHexColor(color) ? color : null
    if (valid === perWorldColor) return
    perWorldColor = valid
    renderCache.clear()
}

/** 设置笔画渐变色列表；仅接受 #rrggbb，过滤非法项，全非法时忽略 */
export function setPatternGradient(colors: unknown): void {
    if (!Array.isArray(colors)) return
    const valid = colors.filter(isHexColor)
    if (valid.length === 0) return
    gradientColors = valid
    renderCache.clear()
}

/** 两色线性插值（#rrggbb） */
function lerpColor(a: string, b: string, t: number): string {
    const lerp = (x: number, y: number) => Math.round(x + (y - x) * t)
    const comp = (v: number) => v.toString(16).padStart(2, '0')
    return `#${comp(lerp(parseInt(a.slice(1, 3), 16), parseInt(b.slice(1, 3), 16)))}` +
        `${comp(lerp(parseInt(a.slice(3, 5), 16), parseInt(b.slice(3, 5), 16)))}` +
        `${comp(lerp(parseInt(a.slice(5, 7), 16), parseInt(b.slice(5, 7), 16)))}`
}

/**
 * 在渐变色列表上按 t∈[0,1] 线性插值取色：相邻列表项之间为一段线性渐变。
 * t 由笔画序数经总笔画数归一化得到（首笔 t=0，末笔 t=1）。
 */
function gradientAt(colors: string[], t: number): string {
    if (colors.length === 1) return colors[0]
    const pos = t * (colors.length - 1)
    const i0 = Math.min(Math.floor(pos), colors.length - 2)
    return lerpColor(colors[i0], colors[i0 + 1], pos - i0)
}

// ─── 图案动画小球 ─────────────────────────────────────────────
/** 动画经过单个笔画的时间（秒）；出现 / 消失也各占一步；轮间停顿固定 0.5s，不受步长影响 */
let ballStep = 0.5

/** 设置动画步长；仅接受 [0.01, 1000]，非法 / 越界时回退默认 0.5 */
export function setBallStep(step: unknown): void {
    const valid = typeof step === 'number' && Number.isFinite(step) ? Math.min(1000, Math.max(0.01, step)) : 0.5
    if (valid === ballStep) return
    ballStep = valid
    renderCache.clear()
}

/** 动画关键帧数值格式化（保留 4 位小数，避免舍入导致 keyTimes 非严格递增） */
function fmtKey(n: number): string {
    return (Math.round(n * 1e4) / 1e4).toString()
}

/** 动画小球填充色；null 表示不显示小球（配置留空 / 非法色值） */
let ballColor: string | null = null

/** 设置动画小球颜色；仅接受 #rrggbb，非法值（含空串）视为不显示 */
export function setBallColor(color: unknown): void {
    const valid = isHexColor(color) ? color : null
    if (valid === ballColor) return
    ballColor = valid
    renderCache.clear()
}

/**
 * 动画小球元素（SVG 最上层）：半径 = 笔画粗细，仅在渐变色笔画时调用。
 * 周期 = 出现 + N×移动 + 消失 + 停顿（每两步之间间隔固定 0.5s，不受步长影响）：
 *  - 出现：scale 线性从 0 放大到 1，停在起点；
 *  - 移动：沿笔画路径匀速行进，一次经过一个笔画；
 *  - 消失：scale 线性从 1 缩到 0，停在终点；
 *  - 停顿：停在终点，等待下一轮。
 * 出现 / 消失 / 每步移动各用 ballStep 秒。
 */
const BALL_PAUSE_SEC = 0.5

function renderBall(pathD: string, segCount: number, strokeWidth: number, color: string): string {
    if (segCount <= 0) return ''
    const total = (segCount + 3) * ballStep + BALL_PAUSE_SEC
    const appearEnd = ballStep / total
    const moveEnd = ((segCount + 1) * ballStep) / total
    const exitEnd = ((segCount + 2) * ballStep) / total
    // scale 线性关键帧：0→1（出现）、恒 1（移动）、1→0（消失）、恒 0（轮间停顿）
    const scale =
        `<circle cx="0" cy="0" r="${strokeWidth}" fill="${color}">` +
        `<animateTransform attributeName="transform" attributeType="XML" type="scale" ` +
        `values="0;1;1;0;0" keyTimes="0;${fmtKey(appearEnd)};${fmtKey(moveEnd)};${fmtKey(exitEnd)};1" calcMode="linear" ` +
        `dur="${fmtKey(total)}s" repeatCount="indefinite"/>` +
        `</circle>`
    // 移动动画：keyPoints 重复值使出现 / 消失 / 停顿相位停在路径首末，移动相位匀速 0→1
    const motion =
        `<animateMotion dur="${fmtKey(total)}s" repeatCount="indefinite" calcMode="linear" ` +
        `keyPoints="0;0;1;1;1" keyTimes="0;${fmtKey(appearEnd)};${fmtKey(moveEnd)};${fmtKey(exitEnd)};1" path="${pathD}"/>`
    return `<g>${scale}${motion}</g>`
}

/** 渐变图案：每条笔画拆成独立 path，各笔内沿自身起点→终点渐变。
 *  第 i 笔跨渐变色列表的 [i/N, (i+1)/N] 段，首笔起点、末笔终点分别对齐列表首末色。
 *  端点圆头，拐点由相邻笔画圆头重叠形成圆角连接。 */
function renderPatternUri(entry: PatternEntry, opts: RenderOptions): string | null {
    const pts = patternPoints(entry.startdir, entry.signature)
    if (!pts) return null
    const segCount = pts.length - 1
    if (segCount <= 0) return null
    const cmds: PathCmd[] = []
    for (let i = 0; i < segCount; i++) {
        cmds.push({ t: 'M', p: pts[i] })
        cmds.push({ t: 'L', p: pts[i + 1] })
    }
    const { scale, ox, oy } = fitScale(pts, cmds, opts.content, opts.canvas)
    const tx = (x: number) => fmt(x * scale + ox)
    const ty = (y: number) => fmt(y * scale + oy)
    // 卓越图案有有效覆盖色时整图使用该纯色，否则与普通图案一样用渐变
    const override = entry.is_per_world === true ? perWorldColor : null
    const defs: string[] = []
    const paths: string[] = []
    for (let i = 0; i < segCount; i++) {
        const ax = tx(pts[i][0])
        const ay = ty(pts[i][1])
        const bx = tx(pts[i + 1][0])
        const by = ty(pts[i + 1][1])
        if (override) {
            paths.push(
                `<path d="M${ax},${ay}L${bx},${by}" fill="none" stroke="${override}" stroke-width="${opts.strokeWidth}" stroke-linecap="round"/>`,
            )
            continue
        }
        // 第 i 笔占列表跨度 [i/N, (i+1)/N]，渐变沿笔画自身方向（笔起点 → 笔终点）
        const t0 = i / segCount
        const t1 = (i + 1) / segCount
        defs.push(
            `<linearGradient id="pg${i}" gradientUnits="userSpaceOnUse" x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}">` +
            `<stop offset="0" stop-color="${gradientAt(gradientColors, t0)}"/>` +
            `<stop offset="1" stop-color="${gradientAt(gradientColors, t1)}"/>` +
            `</linearGradient>`,
        )
        paths.push(
            `<path d="M${ax},${ay}L${bx},${by}" fill="none" stroke="url(#pg${i})" stroke-width="${opts.strokeWidth}" stroke-linecap="round"/>`,
        )
    }
    // 动画小球：最上层，仅在渐变色笔画时显示（per-world 覆盖时不显示），颜色取配置值
    const ballPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${tx(p[0])},${ty(p[1])}`).join('')
    const ballSvg = !override && ballColor ? renderBall(ballPath, segCount, opts.strokeWidth, ballColor) : ''
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.canvas}" height="${opts.canvas}" viewBox="0 0 ${opts.canvas} ${opts.canvas}">` +
        (defs.length > 0 ? `<defs>${defs.join('')}</defs>` : '') +
        paths.join('') +
        ballSvg +
        `</svg>`
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/** 按 entry.id 缓存渲染图案；命中缓存直接返回，否则渲染后写入缓存 */
function renderCached(entry: PatternEntry, cache: Map<string, string>, opts: RenderOptions): string | null {
    if (typeof entry.startdir !== 'string' || entry.startdir.length === 0) return null
    if (typeof entry.signature !== 'string' || entry.signature.length === 0) return null
    const hit = cache.get(entry.id)
    if (hit) return hit
    const uri = renderPatternUri(entry, opts)
    if (uri === null) return null
    cache.set(entry.id, uri)
    return uri
}

/**
 * 惰性求值获取图案渐变图（base64 data URI），hover 与补全共用，按 entry.id 缓存。
 * cache=false 时不缓存（用于 raw 图案，id 为合成的 'raw:'+sig）。
 * 无 startdir/signature 返回 null。
 */
export function getPatternImage(entry: PatternEntry, opts?: { cache?: boolean }): string | null {
    if (opts?.cache === false) return renderPatternUri(entry, PATTERN_RENDER)
    return renderCached(entry, renderCache, PATTERN_RENDER)
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
    return list.find(e => e.startdir === 'EAST') ?? list[0]
}

// ─── 图案名称展示（hover 前置区段）────────────────────────────

/** book_url 归一化：hexdoc 站实际走 https，统一 http→https 便于点击跳转 */
function normalizeBookUrl(url: unknown): string | undefined {
    if (typeof url !== 'string' || url.length === 0) return undefined
    return url.replace(/^http:\/\//, 'https://')
}

/** 目标可用时生成 [text](target)；链接不可用时直接返回纯文本 */
function linkTo(target: string | undefined, text: string): string {
    return target ? `[${text}](${target})` : text
}

/** 名称行文本：图案名链接到 hexdoc 图案页面，modid 链接到 hexdoc 书主页；链接不可用时输出纯文本 */
export function formatPatternEntryText(entry: PatternEntry): string {
    return tr('hover.patternName', {
        name: linkTo(entry.pageUrl, pickPatternName(entry)),
        modid: linkTo(entry.modUrl, entry.modid),
    })
}

/** 单条名称行：`![图案名](图片) 名称 (modid)`；无渲染时退回纯文本 */
export function formatPatternEntry(entry: PatternEntry): string {
    const name = pickPatternName(entry)
    const text = formatPatternEntryText(entry)
    const image = getPatternImage(entry)
    return image ? `![${name}](${image}) ${text}` : text
}

/** 前置区段与 base 之间的统一分隔线 */
const NAME_BASE_SEP = '\n\n---\n\n'

/**
 * 为 pattern 类型 hover 前置图案名称区段，返回完整 markdown。
 * 索引构建失败 → 前置提示；长ID命中或短ID唯一命中 → 前置单条；短ID多命中 → 前置列表；未命中 → 原样返回。
 */
export function prependPatternName(base: string, query: string): string {
    const index = getPatternIndex()
    if (!index) return tr('hover.patternIndexHint') + NAME_BASE_SEP + base

    const q = query.toLowerCase()
    const hit = index.byId.get(q)
    if (hit) {
        return `${formatPatternEntry(hit)}${NAME_BASE_SEP}${base}`
    }
    const shortHits = index.byShort.get(q)
    if (shortHits && shortHits.length > 0) {
        if (shortHits.length === 1) {
            const entry = shortHits[0]
            return `${formatPatternEntry(entry)}${NAME_BASE_SEP}${base}`
        }
        return tr('hover.patternNameList', { list: shortHits.map(formatPatternEntryText).join(', ') }) + NAME_BASE_SEP + base
    }
    // 未命中：若导出中断仍有剩余未导出包，与无索引时提示相同信息
    if (getDumpRemaining() > 0) return tr('hover.patternIndexHint') + NAME_BASE_SEP + base
    return base
}
