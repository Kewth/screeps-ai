import { logError } from "utils/other"

type sourceType = StructureContainer | Resource
type targetType = ConstructionSite

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
            obj.store.getUsedCapacity() >= obj.store.getCapacity() * 0.25 // 500
    }) as StructureContainer
    if (container) return container.id
    // 寄
    logError('no source', creep.name)
    return undefined
}

function calcTargetID(creep: Creep): Id<targetType> | undefined {
    // 寻找工地
    const target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
    if (target) return target.id
    // 寄
    logError('no target', creep.name)
    return undefined
}

export const farBuilderLogic: creepLogic = {
    // prepare:
    prepare_stage: creep => {
        const mem = creep.memory as FarBuilderMemory
        if (!mem.targetFlagName) {
            logError('no targetFlagName', creep.name)
            return false
        }
        const flag = Game.flags[mem.targetFlagName]
        if (!flag) {
            logError('no flag', creep.name)
            return false
        }
        // 走到 flag 所在房间
        if (creep.room != flag.room) {
            creep.moveTo(flag)
            return false
        }
        return true
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
        if (!mem.sourceID) mem.sourceID = calcSourceID(creep)
        if (!mem.sourceID) return false
        const test = Game.getObjectById<sourceType>(mem.sourceID)
        if (!test) mem.sourceID = calcSourceID(creep)
        if (!mem.sourceID) return false
        const source = Game.getObjectById<sourceType>(mem.sourceID)
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
        if (!mem.targetID) mem.targetID = calcTargetID(creep)
        if (!mem.targetID) return false
        const test = Game.getObjectById<targetType>(mem.targetID)
        if (!test) mem.targetID = calcTargetID(creep)
        if (!mem.targetID) return false
        const target = Game.getObjectById<targetType>(mem.targetID)
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

export function initFarBuilderMemory(targetFlagName: string): CreepMemory {
    return {
        role: 'farBuilder',
        taskName: 'auto',
        targetFlagName: targetFlagName,
    }
}
