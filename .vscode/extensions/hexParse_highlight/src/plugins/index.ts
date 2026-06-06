// 生成于 GLM-5V-Turbo
import { PrefixEntry, HoverEntry } from '../types'

import { hexalPrefixes, hexalHovers } from './hexal'
import { moreIotasPrefixes, moreIotasHovers } from './moreIotas'
import { hexcellularPrefixes, hexcellularHovers } from './hexcellular'
import { hexArsLinkerPrefixes, hexArsLinkerHovers } from './hexArsLinker'
import { hexPosePrefixes, hexPoseHovers } from './hexPose'
import { oneironautPrefixes, oneironautHovers } from './oneironaut'
import { ephemeraPrefixes, ephemeraHovers } from './ephemera'
import { hexFlowPrefixes, hexFlowHovers } from './hexFlow'

/** All plugin prefix completion entries aggregated */
export const allPluginPrefixes: PrefixEntry[] = [
    ...hexalPrefixes,
    ...moreIotasPrefixes,
    ...hexcellularPrefixes,
    ...hexArsLinkerPrefixes,
    ...hexPosePrefixes,
    ...oneironautPrefixes,
    ...ephemeraPrefixes,
    ...hexFlowPrefixes,
]

/** All plugin hover entries aggregated */
export const allPluginHovers: HoverEntry = {
    ...hexalHovers,
    ...moreIotasHovers,
    ...hexcellularHovers,
    ...hexArsLinkerHovers,
    ...hexPoseHovers,
    ...oneironautHovers,
    ...ephemeraHovers,
    ...hexFlowHovers,
}
