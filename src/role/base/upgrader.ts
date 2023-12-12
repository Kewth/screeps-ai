import { logError } from "utils/other"

declare global {
    interface UpgraderData extends EmptyData {
        isExtra?: boolean
        energyFromLink?: boolean
    }
}

function calcFrom(creep: Creep) {
    const data = creep.memory.data as UpgraderData
    const link = creep.room.myUpgradeLink()
    if (link && link.store[RESOURCE_ENERGY] > 0) {
        data.energyFromLink = true
        return link
    }
    const container = creep.room.upgradeContainers().find(obj => obj.store[RESOURCE_ENERGY] > 0)
    if (container) {
        data.energyFromLink = undefined
        return container
    }
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
        const data = creep.memory.data as UpgraderData
        const to = creep.room.controller
        if (to) {
            const res = creep.upgradeController(to)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res == OK) {
                // 把 link 搬到 container 增加 link 效率
                if (creep.store[RESOURCE_ENERGY] > 100 && data.energyFromLink) {
                    const container = creep.room.upgradeContainers().find(
                        obj => obj.store[RESOURCE_ENERGY] < 1500 && obj.pos.isNearTo(creep)
                    )
                    container && creep.transfer(container, RESOURCE_ENERGY, creep.store[RESOURCE_ENERGY] - 50)
                }
                // withdraw / upgrade
                // 稳定后可以一直待在 target_stage
                else if (creep.store[RESOURCE_ENERGY] < 50) {
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
        const data = memData as UpgraderData
        if (data.isExtra) {
            if (spawnRoom.storage?.my)
                return spawnRoom.storage.lowEnergy()
            else
                return _.any(spawnRoom.commonContainers(), obj => obj.store.getUsedCapacity() < 1800)
        }
        const ctrl = spawnRoom.controller
        if (!ctrl) return true
        if (ctrl.level >= 8 && ctrl.ticksToDowngrade >= 180_000)
            return true
        return false
    },
    stopSpawn(spawnRoom, memData) {
        const data = memData as UpgraderData
        const ctrl = spawnRoom.controller
        return Boolean(data.isExtra && ctrl && ctrl.level >= 8)
    },
}
