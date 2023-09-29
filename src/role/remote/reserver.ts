// 走到目标预定到死

import { logError } from "utils/other"

declare global {
    interface ReserverData extends EmptyData {
        targetRoomName: string
    }
}

export const reserverLogic: CreepLogic = {
    prepare_stage: creep => {
        const data = creep.memory.data as ReserverData
        if (!creep.goToRoom(data.targetRoomName)) return false
        const ctrl = creep.room.controller
        if (!ctrl) { logError("no controller", creep.name); return false }
        if (!creep.pos.isNearTo(ctrl)) { creep.moveTo(ctrl); return false }
        return true
    },
    source_stage: creep => {
        const ctrl = creep.room.controller
        if (ctrl) {
            if (ctrl.reservation && ctrl.reservation.username != 'Kewth')
                creep.attackController(ctrl)
            else
                creep.reserveController(ctrl)
        }
        return false
    },
    hangSpawn: (spawnRoom, rawData) => {
        const data = rawData as ReserverData
        const targetRoom = Game.rooms[data.targetRoomName]
        if (!targetRoom) return true // 没有视野
        if (targetRoom.enemyOrInvaderCreeps().length > 0) return true // 房间里有危险
        if (!targetRoom.controller) return true // 没有控制器 (?)
        if (targetRoom.controller.reservation && targetRoom.controller.reservation.ticksToEnd >= 2500) return true // 预定充足
        return false
    }
}
