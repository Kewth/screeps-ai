// 拆 level 0 的 invaderCore

import { noInvader } from "utils/other"

type targetType = StructureInvaderCore

interface coreKillerMemory {
    targetID?: Id<StructureInvaderCore>
    targetFlagName: string
}

function calcTarget(creep: Creep): targetType | undefined {
    const cores = creep.room.find(FIND_STRUCTURES, {
        filter: obj => obj.structureType == STRUCTURE_INVADER_CORE
    }) as StructureInvaderCore[]
    return _.first(cores)
}

export const coreKillerLogic: CreepLogic = {
    // prepare:
    prepare_stage: creep => {
        const mem = creep.memory as coreKillerMemory
        return creep.goToRoomByFlag(mem.targetFlagName)
    },
    // target:
    target_stage: creep => {
        const mem = creep.memory as coreKillerMemory
        let target = mem.targetID && Game.getObjectById(mem.targetID)
        if (!target) target = calcTarget(creep)
        mem.targetID = target?.id
        if (target) {
            if (creep.attack(target) == ERR_NOT_IN_RANGE)
                creep.moveTo(target)
        }
        return false
    },
    //
    needSpawn: task => {
        const flagName = task.memory.targetFlagName
        if (!flagName || !noInvader(flagName)) return false
        const room = Game.flags[flagName].room
        if (!room) return false
        return room.find(FIND_STRUCTURES, {
            filter: obj => obj.structureType == STRUCTURE_INVADER_CORE && obj.level == 0
        }).length > 0
    },
}

export function initCoreKillerMemory(targetFlagName: string): CreepMemory {
    return {
        role: 'coreKiller',
        taskName: 'auto',
        targetFlagName: targetFlagName,
    }
}
