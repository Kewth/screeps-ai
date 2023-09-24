import { logConsole, logError } from "utils/other"

// assumption: 房间里有 storage

type repairType = StructureRoad | StructureContainer
type targetType = StructureWall | StructureRampart | repairType

interface RepairerMemory extends CreepMemory {
    targetID?: Id<targetType>
}

function calcTargetID(creep: Creep): Id<targetType> | undefined {
    // 优先 repair
    const broken = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: obj =>
            (obj.structureType == STRUCTURE_CONTAINER ||
                obj.structureType == STRUCTURE_ROAD) &&
            obj.hits < obj.hitsMax * 0.9
    }) as repairType
    if (broken) return broken.id
    // 其次刷墙
    const walls = creep.room.find(FIND_STRUCTURES, {
        filter: obj =>
            (obj.structureType == STRUCTURE_WALL || obj.structureType == STRUCTURE_RAMPART)
            && obj.hits < obj.hitsMax * 0.9
    }) as (StructureWall | StructureRampart)[]
    if (walls.length > 0) {
        const wall = _.min(walls, obj => obj.hits)
        return wall.id
    }
    // 寄
    logError('no target', creep.name)
    return undefined
}

function checkTargetID(id: Id<targetType> | undefined): boolean {
    if (!id) return false
    const test = Game.getObjectById<targetType>(id)
    if (!test) return false
    if (test instanceof StructureWall) return true
    // repairType
    return test.hits < test.hitsMax
}

export const repairerLogic: CreepLogic = {
    // source: 从 storage 拿能量
    source_stage: creep => {
        const mem = creep.memory as RepairerMemory
        // 拿满就走
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) return true
        // 移动/获取
        const source = creep.room.storage
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
        if (!checkTargetID(mem.targetID))
            mem.targetID = calcTargetID(creep)
        if (!mem.targetID) return false
        const target = Game.getObjectById<targetType>(mem.targetID)
        // 移动/工作
        if (target && creep.repair(target) == ERR_NOT_IN_RANGE)
            creep.moveTo(target)
        return false
    },
}

export function initRepairerMemory(): CreepMemory {
    return {
        role: 'repairer',
        taskName: 'auto',
    }
}
