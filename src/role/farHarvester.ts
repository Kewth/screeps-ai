import { harvesterLogic } from "./harvester"

// 目前两者逻辑相同
export const farHarvesterLogic = harvesterLogic

export function initFarHarvesterMemory(sourceFlagName: string): CreepMemory {
    return {
        role: 'farHarvester',
        taskName: 'auto',
        sourceFlagName: sourceFlagName,
    }
}
