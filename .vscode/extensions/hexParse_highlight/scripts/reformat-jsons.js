// 生成于 GLM-5V-Turbo
const fs = require('fs')
const path = require('path')

const DIRS = [path.join(__dirname, '..', 'locales'), path.join(__dirname, '..', 'snippets', 'src')]

function reformatDir(dir) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            reformatDir(full)
        } else if (entry.name.endsWith('.json')) {
            reformatFile(full)
        }
    }
}
function reformatFile(full) {
    try {
        const raw = fs.readFileSync(full, 'utf8')
        const obj = JSON.parse(raw)
        const formatted = JSON.stringify(obj, null, 4) + '\n'
        if (raw !== formatted) {
            fs.writeFileSync(full, formatted, 'utf8')
            console.log('reformatted:', path.relative(path.join(__dirname, '..'), full))
        }
    } catch (err) {
        console.error('skip (invalid json):', path.relative(path.join(__dirname, '..'), full), err.message)
    }
}

const target = process.argv[2]
if (target) {
    reformatFile(path.resolve(target))
} else {
    for (const d of DIRS) reformatDir(d)
}
console.log('done.')
