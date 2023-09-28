// 将 resource 收集到 storage

import { anyStore, hasResource, logError } from "utils/other"

export interface CollectorData {
    fromID?: Id<Resource | Tombstone | StructureContainer | StructureLink>
}

function calcFrom (creep: Creep) {
    const data = creep.memory.data as CollectorData
    let from = data.fromID && Game.getObjectById(data.fromID)
    if (!from || !hasResource(from)) from =
        creep.pos.findClosestByPath(creep.room.dropResources()) ||
        creep.room.centralLink() ||
        creep.pos.findClosestByPath(creep.room.tombstones(), {
            filter: obj => obj.store.getUsedCapacity() > 0
        }) ||
        creep.pos.findClosestByPath(creep.room.containers(), {
            filter: obj => obj.store.getUsedCapacity() > 0
        })
    data.fromID = from?.id
    return from
}

export const collectorLogic: CreepLogic = {
    source_stage: creep => {
        const data = creep.memory.data as CollectorData
        if (creep.store.getFreeCapacity() <= 0) { delete data.fromID; return true }
        const from = calcFrom(creep)
        if (from) {
            const res = creep.gainAnyResourceFrom(from)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(from)
            else if (res == OK) { // 预测下一步转到 storage
                data.fromID = undefined
                creep.room.storage && creep.moveTo(creep.room.storage)
            }
            else
                logError("cannot get resource", creep.name)
        }
        return false
    },

    target_stage: creep => {
        if (creep.store.getUsedCapacity() <= 0) return true
        const to = creep.room.storage
        const resource = anyStore(creep.store)
        if (to && resource) {
            const res = creep.transfer(to, resource)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res == OK) { // 断定下一步是拿资源
                const from = calcFrom(creep)
                from && creep.moveTo(from)
            }
            else
                logError("cannot send resource to storage", creep.name)
        }
        return false
    },
}
