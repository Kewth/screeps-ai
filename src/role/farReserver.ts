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
        // 走到 flag 所在房间
        const flag = Game.flags[mem.targetFlagName]
        if (creep.room != flag.room) {
            creep.moveTo(flag)
            return false
        }
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
        if (!task.memory.targetFlagName) return false
        const room = Game.flags[task.memory.targetFlagName].room
        if (!room || !room.controller) return false
        if (!room.controller.reservation) return true
        return room.controller.reservation.ticksToEnd < 2000
    },
}

export function initFarReserverMemory(targetFlagName: string): CreepMemory {
    return {
        role: 'farReserver',
        taskName: 'auto',
        targetFlagName: targetFlagName,
    }
}
