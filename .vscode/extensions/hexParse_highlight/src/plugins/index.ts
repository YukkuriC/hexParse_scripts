// 生成于 GLM-5V-Turbo
import { PluginDef, PrefixEntry, HoverEntry, ValueExtractor, TokenValidator } from '../types'

// ─── Import all plugin definitions ──────────────────────────

import { corePlugin } from './core'
import { hexalPlugin } from './hexal'
import { moreIotasPlugin } from './moreIotas'
import { hexcellularPlugin } from './hexcellular'
import { hexArsLinkerPlugin } from './hexArsLinker'
import { hexPosePlugin } from './hexPose'
import { oneironautPlugin } from './oneironaut'
import { ephemeraPlugin } from './ephemera'
import { hexFlowPlugin } from './hexFlow'

// ─── Plugin Registry ─────────────────────────────────────────

/** All registered plugins (core first, then external) */
export const ALL_PLUGINS: PluginDef[] = [
    corePlugin,
    hexalPlugin,
    moreIotasPlugin,
    hexcellularPlugin,
    hexArsLinkerPlugin,
    hexPosePlugin,
    oneironautPlugin,
    ephemeraPlugin,
    hexFlowPlugin,
]

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
