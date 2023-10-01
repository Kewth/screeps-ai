// 基本的能量搬运

import { logError } from "utils/other"

declare global {
    interface CarrierData extends EmptyData {
        toID?: Id<StructureSpawn | StructureExtension | StructureTower>
    }
}

function calcTo (creep: Creep, banID?: string) {
    const data = creep.memory.data as CarrierData
    let to = data.toID && (data.toID != banID) && Game.getObjectById(data.toID)
    if (!to || to.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) to =
        creep.pos.findClosestByPath(creep.room.myTowers(), {
            filter: obj => obj.store.getFreeCapacity(RESOURCE_ENERGY) > 100 && obj.id != banID
        }) ||
        creep.pos.findClosestByPath(creep.room.mySpawns(), {
            filter: obj => obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && obj.id != banID
        }) ||
        creep.pos.findClosestByPath(creep.room.myExtensions(), {
            filter: obj => obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && obj.id != banID
        })
    data.toID = to?.id
    return to
}

export const carrierLogic: CreepLogic = {
    source_stage: creep => {
        if (creep.store.getFreeCapacity() <= 0) return true
        const from = creep.room.anyEnergySource()
        if (from) {
            const res = creep.gainResourceFrom(from, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(from)
            else if (res == OK) { // 断定下一步是送能量
                const to = calcTo(creep)
                to && creep.moveTo(to)
            }
            else
                logError("cannot get energy", creep.name)
        }
        return false
    },
    target_stage: creep => {
        const data = creep.memory.data as CarrierData
        if (creep.store.getUsedCapacity() <= 0) { delete data.toID; return true }
        const to = calcTo(creep)
        if (to) {
            const res = creep.transfer(to, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res == OK) { // 预测下一步还是送能量
                const nextTo = calcTo(creep, data.toID)
                nextTo && creep.moveTo(nextTo)
            }
            else
                logError("cannot send energy", creep.name)
        }
        return false
    },
}
