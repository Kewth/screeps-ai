// 将 resource 收集到 storage

import { anyStore, hasResource, logError } from "utils/other"

declare global {
    interface CollectorData extends EmptyData {
        fromID?: Id<Resource | Tombstone | StructureContainer | Ruin>
    }
}

function calcFrom (creep: Creep) {
    const data = creep.memory.data as CollectorData
    let from = data.fromID && Game.getObjectById(data.fromID)
    if (!from || !hasResource(from)) from =
        creep.pos.findClosestByPath(creep.room.dropResources(), {
            filter: obj => obj.amount >= 50
        }) ||
        // [creep.room.centralLink()].find(obj => obj && obj.store[RESOURCE_ENERGY] > 0) ||
        creep.pos.findClosestByPath(creep.room.tombstones(), {
            filter: obj => obj.store.getUsedCapacity() - obj.store[RESOURCE_ENERGY] > 0 ||
                obj.store[RESOURCE_ENERGY] >= 50
        }) ||
        creep.pos.findClosestByPath(creep.room.commonContainers(), {
            filter: obj => obj.store.getUsedCapacity() >= 500
        }) ||
        creep.pos.findClosestByPath(creep.room.ruins(), {
            filter: obj => obj.store.getUsedCapacity() >= 50
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
                delete data.fromID // 可能拿完了自己没满，需要重新搜索目标，否则可能会一直等待该容器
                creep.room.storage && creep.moveTo(creep.room.storage)
            }
            else
                logError(`cannot get resource: ${res}`, creep.name)
        }
        return false
    },

    target_stage: creep => {
        if (creep.store.getUsedCapacity() <= 0) return true
        const to = creep.room.storage
        const resource = anyStore(creep)
        if (to && resource) {
            const res = creep.transfer(to, resource)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res == OK) { // 断定下一步是拿资源
                const from = calcFrom(creep)
                from && creep.moveTo(from)
            }
            else
                logError(`cannot send resource to storage: ${res}`, creep.name)
        }
        return false
    },
}
