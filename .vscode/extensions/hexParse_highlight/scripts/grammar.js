// 生成于 GLM-5V-Turbo
// Merge syntaxes/src/*.yaml into syntaxes/HexParse.tmGrammar.json
//
// Source layout:
//   src/core.yaml        -> top-level + COMMENTS, STRUCTURAL, CUTTER, INIT
//   src/literals.yaml    -> macro, comment_iota, literal, inner_literal, num
//   src/patterns.yaml    -> pattern
//   src/specials.yaml    -> special_handler (base: vec, gate)
//   src/plugins/*.yaml   -> routed by _inject_into field per rule (addon rules)

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const SCRIPT_DIR = path.resolve(__dirname)
const SRC_DIR = path.join(SCRIPT_DIR, '..', 'syntaxes', 'src')

const VALID_TARGETS = new Set(['pattern', 'literal', 'structural', 'special_handler'])
const DEFAULT_TARGET = 'special_handler'

/** Load a YAML file, return parsed object or {} */
function loadYaml(filepath) {
    try {
        const content = fs.readFileSync(filepath, 'utf8')
        return yaml.load(content) || {}
    } catch (err) {
        console.error(`[error] Cannot load ${filepath}: ${err.message}`)
        return {}
    }
}

/**
 * Append a single pattern rule into grammar.repository[targetKey].patterns
 */
function injectPattern(grammar, targetKey, rule) {
    const repo = grammar.repository
    if (!repo[targetKey]) repo[targetKey] = {}
    if (!Array.isArray(repo[targetKey].patterns)) repo[targetKey].patterns = []
    repo[targetKey].patterns.push(rule)
}

/**
 * Parse a plugin YAML file and route rules to their _inject_into targets.
 * Returns number of rules injected.
 */
function mergePluginFile(grammar, filepath, filename) {
    const data = loadYaml(filepath)
    if (!Array.isArray(data)) {
        console.log(`  [warn] plugins/${filename} is not a list, skipping`)
        return 0
    }

    let count = 0
    const targetsUsed = new Set()

    for (const item of data) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue

        // Extract _inject_into; delete it so it won't appear in output JSON
        const target = item._inject_into !== undefined ? item._inject_into : null
        delete item._inject_into

        let resolvedTarget
        if (target !== null) {
            if (!VALID_TARGETS.has(target)) {
                console.log(
                    `  [warn] plugins/${filename}: invalid _inject_into "${target}", ` +
                        `valid: ${Array.from(VALID_TARGETS).join(', ')}`,
                )
                continue
            }
            targetsUsed.add(target)
            resolvedTarget = target
        } else {
            resolvedTarget = DEFAULT_TARGET
        }

        injectPattern(grammar, resolvedTarget, item)
        count++
    }

    if (count > 0) {
        const targetStr = targetsUsed.size > 0 ? Array.from(targetsUsed).sort().join(',') : DEFAULT_TARGET
        console.log(`  [+] plugins/${filename} (${count} rules -> ${targetStr})`)
    }

    return count
}

function main() {
    // ── Base grammar shell ──────────────────────
    const grammar = {
        scopeName: 'source.HexParse',
        patterns: [{ include: '#init' }],
        repository: {},
    }

    // ── Merge core modules (order matters) ───────
    for (const name of ['core', 'literals', 'patterns', 'specials']) {
        const yamlPath = path.join(SRC_DIR, `${name}.yaml`)
        if (!fs.existsSync(yamlPath)) {
            console.log(`[warn] ${name}.yaml not found, skipping`)
            continue
        }
        const data = loadYaml(yamlPath)
        Object.assign(grammar.repository, data)
        console.log(`  [+] ${name}.yaml`)
    }

    // ── Merge plugins with _inject_into routing ──
    const pluginDir = path.join(SRC_DIR, 'plugins')
    if (fs.existsSync(pluginDir)) {
        const pluginFiles = fs
            .readdirSync(pluginDir)
            .filter(f => f.endsWith('.yaml'))
            .sort()

        for (const pf of pluginFiles) {
            mergePluginFile(grammar, path.join(pluginDir, pf), pf)
        }
    }

    // ── Write output ─────────────────────────────
    const jsonPath = path.join(SCRIPT_DIR, '..', 'syntaxes', 'HexParse.tmGrammar.json')
    fs.writeFileSync(jsonPath, JSON.stringify(grammar), 'utf8')
    console.log(`[ok] ${jsonPath}`)
}

main()
