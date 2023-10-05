// 只要能保证不降级就行，从家里带 100 能量去目标充满就自杀

declare global {
    interface ClaimKeeperData extends EmptyData {
        targetRoomName: string
    }
}

export const claimKeeperLogic: CreepLogic = {
    source_stage: creep => {
        if (creep.store.getFreeCapacity() <= 0) return true
        const from = creep.findEnergySource()
        if (from) {
            const res = creep.gainResourceFrom(from, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(from)
        }
        return false
    },
    target_stage: creep => {
        const data = creep.memory.data as ClaimKeeperData
        if (creep.store.getUsedCapacity() <= 0) {
            creep.suicide()
            return false
        }
        if (!creep.goToRoom(data.targetRoomName)) return false
        const ctrl = creep.room.controller
        if (ctrl) {
            const res = creep.upgradeController(ctrl)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(ctrl)
        }
        return false
    },
    hangSpawn: (spawnRoom, memData) => {
        const data = memData as ClaimKeeperData
        const targetRoom = Game.rooms[data.targetRoomName]
        if (!targetRoom) return false // 没有视野
        if (targetRoom.enemyOrInvaderCreeps().length > 0) return true // 房间里有危险
        const ctrl = targetRoom.myController()
        if (!ctrl) return true // 没有控制器或者控制器不是自己的
        if (ctrl.ticksToDowngrade >= 5000) return true // 离降级还远
        return false
    }
}
