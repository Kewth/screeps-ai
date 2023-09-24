import { logConsole, logError, noInvader } from "utils/other"

// 走到目标预定到死

interface FarReserverMemory extends CreepMemory {
    targetFlagName: string
}

export const farResercerLogic: CreepLogic = {
    // prepare:
    prepare_stage: creep => {
        const mem = creep.memory as FarReserverMemory
        if (!creep.goToRoomByFlag(mem.targetFlagName)) return false
        // 移动到 controller
        if (!creep.room.controller) {
            logError('no controller', creep.name)
            return false
        }
        if (!creep.pos.isNearTo(creep.room.controller)) {
            creep.moveTo(creep.room.controller)
            return false
        }
        return true
    },
    // source: 不停预定
    source_stage: creep => {
        if (creep.room.controller) creep.reserveController(creep.room.controller)
        return false
    },
    //
    needSpawn: task => {
        const flagName = task.memory.targetFlagName
        if (!flagName || !noInvader(flagName)) return false
        const room = Game.flags[flagName].room
        return Boolean(room && room.controller &&
            (!room.controller.reservation || room.controller.reservation.ticksToEnd < 3000))
    },
}

export function initFarReserverMemory(targetFlagName: string): CreepMemory {
    return {
        role: 'farReserver',
        taskName: 'auto',
        targetFlagName: targetFlagName,
    }
}
