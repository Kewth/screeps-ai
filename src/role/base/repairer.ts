import { logError, myMin } from "utils/other"

// 修建筑 > 建工地 > 刷墙

declare global {
    interface RepairerData extends EmptyData {
        fromID?: Id<StructureStorage | StructureContainer | Resource>
        toID?: Id<AnyStructure | ConstructionSite>
    }
}

function calcTo (creep: Creep) {
    const data = creep.memory.data as RepairerData
    let to = data.toID && Game.getObjectById(data.toID)
    if (!to || (!(to instanceof ConstructionSite) && to.hits >= to.hitsMax)) to =
        creep.pos.findClosestByPath(
            [...creep.room.allContainers(), ...creep.room.roads()], {
                filter: obj => obj.hits < obj.hitsMax * 0.9
        })
        ||
        creep.pos.findClosestByPath(creep.room.myConstructionSites())
        ||
        myMin([...creep.room.walls(), ...creep.room.myRamparts()], obj => obj.hits)
    data.toID = to?.id
    return to
}

export const repairerLogic: CreepLogic = {
    source_stage: creep => {
        const data = creep.memory.data as RepairerData
        if (creep.store.getFreeCapacity() <= 0) return true
        const from = creep.findEnergySource()
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
        const data = creep.memory.data as RepairerData
        if (creep.store[RESOURCE_ENERGY] <= 0) { delete data.toID; return true }
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
