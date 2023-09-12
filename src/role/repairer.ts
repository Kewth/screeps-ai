import { logConsole, logError } from "utils/other"

// assumption: 房间里有 storage

type targetType = StructureContainer | StructureRoad | StructureController

interface RepairerMemory extends CreepMemory {
    targetID: Id<targetType> | undefined
}

function calcTargetID(creep: Creep): Id<targetType> | undefined {
    // 优先 repair
    const broken = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: obj =>
            (obj.structureType == STRUCTURE_CONTAINER ||
                obj.structureType == STRUCTURE_ROAD) &&
            obj.hits < obj.hitsMax * 0.9
    }) as targetType
    if (broken) return broken.id
    // 其次 upgrade
    if (creep.room.controller) return creep.room.controller.id
    // 寄
    logError('no target', creep.name)
    return undefined
}

export const repairerLogic: creepLogic = {
    // source: 从 storage 拿能量
    source_stage: creep => {
        const mem = creep.memory as RepairerMemory
        // 拿满就走
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) return true
        // 检查 sourceID
        const source = creep.room.storage
        // 移动/获取
        if (source && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            creep.moveTo(source)
        return false
    },
    // target: 放到 targetID 里面
    target_stage: creep => {
        const mem = creep.memory as RepairerMemory
        // 没了就撤
        if (creep.store.getUsedCapacity() <= 0) {
            // 清除 targetID 下次重新搜索
            mem.targetID = undefined
            return true
        }
        // 检查 targetID
        if (!mem.targetID) mem.targetID = calcTargetID(creep)
        if (!mem.targetID) return false
        const test = Game.getObjectById<targetType>(mem.targetID)
        if (!test || (!(test instanceof StructureController) && test.hits >= test.hitsMax))
            mem.targetID = calcTargetID(creep)
        if (!mem.targetID) return false
        const target = Game.getObjectById<targetType>(mem.targetID)
        // 移动/工作
        if (target) {
            if (target instanceof StructureController) {
                if (creep.upgradeController(target) == ERR_NOT_IN_RANGE)
                    creep.moveTo(target)
            } else {
                if (creep.repair(target) == ERR_NOT_IN_RANGE)
                    creep.moveTo(target)
            }
        }
        return false
    },
}
