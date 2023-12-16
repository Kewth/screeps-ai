import { logError } from "utils/other"

// 走到目标预定到死

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
            else if (creep.room.memory.needClaim)
                creep.claimController(ctrl)
            else
                creep.reserveController(ctrl)
        }
        return false
    },
    checkSpawn: (spawnRoom, mixData) => {
        const data = mixData as ReserverData
        if (data.onlyOnce) return 'spawn' // 自己是一次性的话就同时担任 view 的任务，不需要目标视野
        const targetRoom = Game.rooms[data.targetRoomName]
        if (!targetRoom) return 'hang' // 没有视野
        if (targetRoom.enemyOrInvaderCreeps().length > 0) return 'hang' // 房间里有危险
        if (!targetRoom.controller) return 'hang' // 没有控制器 (?)
        const reservation = targetRoom.controller.reservation
        if (reservation && reservation.username == 'Kewth' && reservation.ticksToEnd >= 2500) return 'hang' // 预定充足
        if (targetRoom.controller.my) return 'hang' // 已经被 claim 了
        return 'spawn'
    },
    // hangSpawn: (spawnRoom, memData) => {
    //     const data = memData as ReserverData
    //     if (data.onlyOnce) return false // 自己是一次性的话就同时担任 view 的任务，不需要目标视野
    //     const targetRoom = Game.rooms[data.targetRoomName]
    //     if (!targetRoom) return true // 没有视野
    //     if (targetRoom.enemyOrInvaderCreeps().length > 0) return true // 房间里有危险
    //     if (!targetRoom.controller) return true // 没有控制器 (?)
    //     const reservation = targetRoom.controller.reservation
    //     if (reservation && reservation.username == 'Kewth' && reservation.ticksToEnd >= 2500) return true // 预定充足
    //     if (targetRoom.controller.my) return true // 已经被 claim 了
    //     return false
    // },
}
