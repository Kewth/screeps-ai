import { spawn } from "child_process"
import { logConsole, logError, myMin } from "utils/other"

// 修建筑，修完了跑去刷会墙

declare global {
    interface BuilderData extends EmptyData {
        toID?: Id<StructureWall | StructureRampart | ConstructionSite>
    }
}

function calcTo (creep: Creep) {
    const data = creep.memory.data as BuilderData
    let to = data.toID && Game.getObjectById(data.toID)
    if (!to || (!(to instanceof ConstructionSite) && to.hits >= to.hitsMax)) to =
        // 综合距离和进度选择工地
        myMin(creep.room.myConstructionSites(), obj => (obj.progressTotal - obj.progress) + creep.pos.getRangeTo(obj) * 500)
        // creep.pos.findClosestByPath(creep.room.myConstructionSites())
        ||
        myMin([...creep.room.walls(), ...creep.room.myRamparts()], obj => obj.hits)
    data.toID = to?.id
    return to
}

export const builderLogic: CreepLogic = {
    source_stage: creep => {
        const data = creep.memory.data as BuilderData
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
        const data = creep.memory.data as BuilderData
        if (creep.store[RESOURCE_ENERGY] <= 0) { delete data.toID; return true }
        const to = calcTo(creep)
        if (to) {
            const res = to instanceof ConstructionSite ? creep.build(to) : creep.repair(to)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res == OK) { // 预测下一步不变
            }
            else
                logError(`cannot build/repair: ${res}`, creep.name)
        }
        return false
    },
    hangSpawn: (spawnRoom, memData) => {
        const totNeed = _.sum(spawnRoom.myConstructionSites(), obj => obj.progressTotal - obj.progress)
        if (totNeed <= 3000) return true // 没工地了或者工地太小 (修几条路交给 repairer 来干就可以)
        return false
    }
}
