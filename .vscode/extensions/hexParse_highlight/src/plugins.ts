// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry, HoverRegex, HoverValue, ValueExtractor, TokenValidator } from './types'
import { ALL_PLUGINS } from './pluginsGen'

// ─── Flat Accessors (for backward compat & convenience) ─────

/** 归一化 hovers 声明为有序元组数组：对象按键插入序转为数组 */
function normalizeHovers(hovers: HoverEntry): [string, HoverValue][] {
    return Array.isArray(hovers) ? hovers : Object.entries(hovers)
}

/** All prefix completion entries flattened */
export const allPluginPrefixes: PrefixEntry[] = ALL_PLUGINS.flatMap((p) => p.prefixes)

/** All hover entries merged into a single ordered list (顺序即优先级) */
export const allPluginHovers: [string, HoverValue][] = ALL_PLUGINS.flatMap((p) => normalizeHovers(p.hovers))

/** All regex hover entries merged into a single ordered list */
export const allHoversRegex: HoverRegex = ALL_PLUGINS.flatMap((p) => p.hoversRegex ?? [])

/** All value extractors merged (later plugins override earlier for same key) */
export const allValueExtractors: Record<string, ValueExtractor> = Object.assign(
    {},
    ...ALL_PLUGINS.map((p) => p.valueExtractors ?? {}),
)

/** All empty defaults merged */
export const allEmptyDefaults: Record<string, string> = Object.assign(
    {},
    ...ALL_PLUGINS.map((p) => p.emptyDefaults ?? {}),
)

/** All token validators flattened */
export const allValidators: TokenValidator[] = ALL_PLUGINS.flatMap((p) => p.validators ?? [])
