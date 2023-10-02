import { logError } from "utils/other"

declare global {
    interface UpgraderData extends EmptyData {
        fromID?: Id<StructureStorage | StructureContainer | Resource>
    }
}

export const upgraderLogic: CreepLogic = {
    source_stage: creep => {
        const data = creep.memory.data as UpgraderData
        if (creep.store.getFreeCapacity() <= 0) return true
        const from = creep.findEnergySource()
        if (from) {
            const res = creep.gainResourceFrom(from, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(from)
            else if (res == OK) { // 预测下一步去工作
                creep.room.controller && creep.moveTo(creep.room.controller)
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
            else if (res == OK) { // 预测下一步不变
            }
            else
                logError("cannot upgrade", creep.name)
        }
        return false
    },
}
