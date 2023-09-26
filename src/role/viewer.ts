import { noInvader } from "utils/other"

// 获取视野

interface viewerMemory {
    targetFlagName: string
}

export const viewerLogic: CreepLogic = {
    // prepare:
    prepare_stage: creep => {
        const mem = creep.memory as viewerMemory
        const flag = Game.flags[mem.targetFlagName]
        if (!creep.pos.isEqualTo(flag))
            creep.moveTo(flag)
        return false
    },
    // target:
    target_stage: creep => {
        return false
    },
    //
    needSpawn: task => {
        const flagName = task.memory.targetFlagName
        return Boolean(flagName && noInvader(flagName))
    },
}

export function initViewerMemory(targetFlagName: string): CreepMemory {
    return {
        role: 'viewer',
        taskName: 'auto',
        targetFlagName: targetFlagName,
    }
}

// 获取视野

