// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry, ValueExtractor, TokenValidator } from './types'
import { ALL_PLUGINS } from './pluginsGen'

// ─── Flat Accessors (for backward compat & convenience) ─────

/** All prefix completion entries flattened */
export const allPluginPrefixes: PrefixEntry[] = ALL_PLUGINS.flatMap((p) => p.prefixes)

/** All hover entries merged into a single map-like object */
export const allPluginHovers: HoverEntry = Object.assign({}, ...ALL_PLUGINS.map((p) => p.hovers))

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
