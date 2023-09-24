import { logError, noInvader } from "utils/other"

// 修工地 + 修路

type sourceType = StructureContainer | Resource
type targetType = ConstructionSite | StructureRoad

interface FarBuilderMemory extends CreepMemory {
    sourceID: Id<sourceType> | undefined
    targetID: Id<targetType> | undefined
    targetFlagName: string
}

function calcSourceID(creep: Creep): Id<sourceType> | undefined {
    // 获取 dropped/container
    const dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES)
    if (dropped) return dropped.id
    const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: obj =>
            obj.structureType == STRUCTURE_CONTAINER &&
            obj.store[RESOURCE_ENERGY] > 0
    }) as StructureContainer
    if (container) return container.id
    // 寄
    logError('no source', creep.name)
    return undefined
}

function calcTargetID(creep: Creep): Id<targetType> | undefined {
    // 优先修路
    const road = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: obj => obj.structureType == STRUCTURE_ROAD && obj.hits < obj.hitsMax * 0.95
    }) as StructureRoad;
    if (road) return road.id
    // 其次工地
    const site = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
    if (site) return site.id
    // 寄
    logError('no target', creep.name)
    return undefined
}

export const farBuilderLogic: CreepLogic = {
    // prepare:
    prepare_stage: creep => {
        const mem = creep.memory as FarBuilderMemory
        return creep.goToRoomByFlag(mem.targetFlagName)
    },
    // source:
    source_stage: creep => {
        const mem = creep.memory as FarBuilderMemory
        // 拿满再走
        if (creep.store.getFreeCapacity() <= 0) {
            mem.sourceID = undefined
            return true
        }
        // 计算 sourceID
        const test = mem.sourceID && Game.getObjectById<sourceType>(mem.sourceID)
        if (!test) mem.sourceID = calcSourceID(creep)
        const source = mem.sourceID && Game.getObjectById<sourceType>(mem.sourceID)
        // 移动/获取
        if (source) {
            if (source instanceof StructureContainer) {
                if (source && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    creep.moveTo(source)
            }
            if (source instanceof Resource) {
                if (source && creep.pickup(source) == ERR_NOT_IN_RANGE)
                    creep.moveTo(source)
            }
        }
        return false
    },
    // target:
    target_stage: creep => {
        const mem = creep.memory as FarBuilderMemory
        // 没了就撤
        if (creep.store.getUsedCapacity() <= 0) {
            mem.targetID = undefined
            return true
        }
        // 计算 targetID
        const test = mem.targetID && Game.getObjectById<targetType>(mem.targetID)
        if (!test || (test instanceof StructureRoad && test.hits == test.hitsMax)) mem.targetID = calcTargetID(creep)
        const target = mem.targetID && Game.getObjectById<targetType>(mem.targetID)
        // 移动/建造
        if (target) {
            if (target instanceof ConstructionSite) {
                if (creep.build(target) == ERR_NOT_IN_RANGE)
                    creep.moveTo(target)
            }
            if (target instanceof StructureRoad) {
                if (creep.repair(target) == ERR_NOT_IN_RANGE)
                    creep.moveTo(target)
            }
        }
        return false
    },
    //
    needSpawn: task => {
        const flagName = task.memory.targetFlagName
        if (!flagName || !noInvader(flagName)) return false
        const room = Game.flags[flagName].room
        if (!room) return false
        return room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 ||
            room.find(FIND_STRUCTURES, {
                filter: obj => obj.structureType == STRUCTURE_ROAD && obj.hits < obj.hitsMax * 0.8
            }).length > 0
    },
}

export function initFarBuilderMemory(targetFlagName: string): CreepMemory {
    return {
        role: 'farBuilder',
        taskName: 'auto',
        targetFlagName: targetFlagName,
    }
}
