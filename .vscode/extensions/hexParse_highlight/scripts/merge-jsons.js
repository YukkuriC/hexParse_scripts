// 生成于 GLM-5V-Turbo
// Merge per-plugin locale JSON files into monolithic package.nls.{locale}.json,
// and per-plugin snippet JSON files into snippets/hexparse.json.
// Usage: node scripts/merge-jsons.js

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

/** Merge JSON files in a directory into one object. Returns { merged, sources }. */
function mergeDir(dirPath) {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json')).sort()
    const merged = {}
    /** Map of key -> source filename */
    const sources = {}

    for (const file of files) {
        const filePath = path.join(dirPath, file)
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        for (const [key, val] of Object.entries(data)) {
            if (key in merged) {
                console.warn(`[warn] Duplicate key "${key}": first seen in "${sources[key]}", overridden by "${file}"`)
            } else {
                sources[key] = file
            }
            merged[key] = val
        }
    }

    return { merged, sources, count: files.length }
}

// ─── Phase 1: Merge locales ──────────────────────────────────

const LOCALES_DIR = path.join(ROOT, 'locales')
for (const locale of fs.readdirSync(LOCALES_DIR).filter(f =>
    fs.statSync(path.join(LOCALES_DIR, f)).isDirectory()
)) {
    const { merged, count } = mergeDir(path.join(LOCALES_DIR, locale))
    const outName = locale === 'en' ? 'package.nls.json' : `package.nls.${locale}.json`
    fs.writeFileSync(
        path.join(ROOT, outName),
        JSON.stringify(merged, null, 2) + '\n',
        'utf8'
    )
    console.log(`[ok] ${outName} (${count} sources, ${Object.keys(merged).length} keys)`)
}

// ─── Phase 2: Merge snippets ─────────────────────────────────

const SNIPPETS_SRC_DIR = path.join(ROOT, 'snippets', 'src')
if (!fs.existsSync(SNIPPETS_SRC_DIR)) {
    console.log('[skip] snippets/src/ not found')
} else {
    const { merged, count } = mergeDir(SNIPPETS_SRC_DIR)
    fs.writeFileSync(
        path.join(ROOT, 'snippets', 'hexparse.json'),
        JSON.stringify(merged, null, 2) + '\n',
        'utf8'
    )
    console.log(`[ok] snippets/hexparse.json (${count} sources, ${Object.keys(merged).length} entries)`)
}
