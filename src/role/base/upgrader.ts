import { logError } from "utils/other"

declare global {
    interface UpgraderData extends EmptyData {
    }
}

function calcFrom(creep: Creep) {
    const link = creep.room.myUpgradeLink()
    if (link && link.store[RESOURCE_ENERGY] > 0) return link
    const containers = creep.room.upgradeContainers().filter(obj => obj.store[RESOURCE_ENERGY] > 0)
    if (containers.length > 0) return containers[0]
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
                // withdraw / upgrade
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
