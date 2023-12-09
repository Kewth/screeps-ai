import { logError } from "utils/other"

declare global {
    interface UpgraderData extends EmptyData {
        // energyFromLink?: boolean
    }
}

function calcFrom(creep: Creep) {
    const link = creep.room.myUpgradeLink()
    if (link && link.store[RESOURCE_ENERGY] > 0) return link
    const container = creep.room.upgradeContainers().find(obj => obj.store[RESOURCE_ENERGY] > 0)
    if (container) return container
    creep.say('不想走路...')
    return creep.findEnergySource()
}

export const upgraderLogic: CreepLogic = {
    source_stage: creep => {
        if (creep.store.getFreeCapacity() <= 0) return true
        const from = calcFrom(creep)
        if (from) {
            const res = creep.gainResourceFrom(from, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(from)
            else if (res == OK) { // 不作预测
                // creep.room.controller && creep.moveTo(creep.room.controller)
            }
            else
                logError("cannot get energy", creep.name)
        }
        return false
    },
    target_stage: creep => {
        if (creep.store[RESOURCE_ENERGY] <= 0) return true
        const to = creep.room.controller
        if (to) {
            const res = creep.upgradeController(to)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res == OK) {
                // 把 link 搬到 container 增加 link 效率
                // if (creep.store[RESOURCE_ENERGY] > 100) {
                //     const container = creep.room.upgradeContainers().find(
                //         obj => obj.store[RESOURCE_ENERGY] < 1500 && obj.pos.isNearTo(creep)
                //     )
                //     container && creep.transfer(container, RESOURCE_ENERGY)
                // }
                // withdraw / upgrade
                // 稳定后可以一直待在 target_stage
                if (creep.store[RESOURCE_ENERGY] < 50) {
                    const from = calcFrom(creep)
                    from && creep.gainResourceFrom(from, RESOURCE_ENERGY)
                }
            }
            else
                logError("cannot upgrade", creep.name)
        }
        return false
    },
    hangSpawn(spawnRoom, memData) {
        const ctrl = spawnRoom.controller
        if (ctrl && ctrl.level >= 8 && ctrl.ticksToDowngrade >= 180_000)
            return true
        return false
    }
}
