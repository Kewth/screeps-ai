import { logConsole, logError } from "utils/other"

// 走到目标预定到死

interface FarReserverMemory extends CreepMemory {
    targetFlagName: string
}

export const farResercerLogic: creepLogic = {
    // prepare:
    prepare_stage: creep => {
        const mem = creep.memory as FarReserverMemory
        if (!mem.targetFlagName) {
            logError('no targetFlagName', creep.name)
            return false
        }
        const flag = Game.flags[mem.targetFlagName]
        if (!creep.pos.inRangeTo(flag, 0)) {
            creep.moveTo(flag)
            return false
        }
        // 移动到位后
        if (!creep.room.controller || !creep.pos.isNearTo(creep.room.controller)) {
            logError('no controller', creep.name)
            return false
        }
        return true
    },
    // source: 不停预定
    source_stage: creep => {
        if (creep.room.controller) creep.reserveController(creep.room.controller)
        return false
    },
}
