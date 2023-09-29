import { logError } from "utils/other"

declare global {
    interface BuilderData extends EmptyData {
        toID?: Id<AnyStructure | ConstructionSite>
    }
}

function calcTo (creep: Creep) {
    const data = creep.memory.data as BuilderData
    let to = data.toID && Game.getObjectById(data.toID)
    if (!to || (!(to instanceof ConstructionSite) && to.hits >= to.hitsMax)) to =
        creep.pos.findClosestByPath(creep.room.containers(), {
            filter: obj => obj.hits < obj.hitsMax * 0.9
        }) ||
        creep.pos.findClosestByPath(creep.room.roads(), {
            filter: obj => obj.hits < obj.hitsMax * 0.9
        }) ||
        creep.pos.findClosestByPath(creep.room.myConstructionSites()) ||
        creep.pos.findClosestByPath(creep.room.walls(), {
            filter: obj => obj.hits < obj.hitsMax * 0.9
        })
    data.toID = to?.id
    return to
}

export const builderLogic: CreepLogic = {
    source_stage: creep => {
        if (creep.store.getFreeCapacity() <= 0) return true
        const from = creep.room.anyEnergySource()
        if (from) {
            const res = creep.gainResourceFrom(from, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(from)
            else if (res == OK) { // 预测下一步去工作
                const to = calcTo(creep)
                to && creep.moveTo(to)
            }
            else
                logError("cannot get energy", creep.name)
        }
        return false
    },
    target_stage: creep => {
        const data = creep.memory.data as BuilderData
        if (creep.store.getUsedCapacity() <= 0) { delete data.toID; return true }
        const to = calcTo(creep)
        if (to) {
            const res = to instanceof ConstructionSite ? creep.build(to) : creep.repair(to)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res == OK) { // 预测下一步不变
            }
            else
                logError("cannot build/repair", creep.name)
        }
        return false
    },
}
