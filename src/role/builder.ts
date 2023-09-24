import { logError } from "utils/other"

// assumption: 房间里有 storage

type targetType = ConstructionSite

interface BuilderMemory extends CreepMemory {
    targetID: Id<targetType> | undefined
}

function calcTargetID(creep: Creep): Id<targetType> | undefined {
    // 寻找工地
    const target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
    if (target) return target.id
    // 没事情做
    return undefined
}

export const builderLogic: CreepLogic = {
    // source:
    source_stage: creep => {
        const mem = creep.memory as BuilderMemory
        // 拿满就走
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) return true
        // 移动/获取
        const source = creep.room.storage
        if (source && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            creep.moveTo(source)
        return false
    },
    // target:
    target_stage: creep => {
        const mem = creep.memory as BuilderMemory
        // 没了就撤
        if (creep.store.getUsedCapacity() <= 0) {
            mem.targetID = undefined
            return true
        }
        // 计算 targetID
        const test = mem.targetID && Game.getObjectById<targetType>(mem.targetID)
        if (!test) mem.targetID = calcTargetID(creep)
        const target = mem.targetID && Game.getObjectById<targetType>(mem.targetID)
        // 移动/建造
        if (target && creep.build(target) == ERR_NOT_IN_RANGE)
            creep.moveTo(target)
        return false
    },
    //
    needSpawn: task => {
        const room = Game.rooms[task.roomName]
        return room && room.find(FIND_MY_CONSTRUCTION_SITES).length > 0
    },
}

export function initBuilderMemory(): CreepMemory {
    return {
        role: 'builder',
        taskName: 'auto',
    }
}
