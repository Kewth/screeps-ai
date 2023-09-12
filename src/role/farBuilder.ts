import { logError } from "utils/other"

type sourceType = StructureStorage
type targetType = ConstructionSite

interface FarBuilderMemory extends CreepMemory {
    sourceID: Id<sourceType>
    targetID: Id<targetType> | undefined
    targetFlagName: string
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
    // prepare: 计算 sourceID
    prepare_stage: creep => {
        const mem = creep.memory as FarBuilderMemory
        if (!mem.targetFlagName) {
            logError('no targetFlagName', creep.name)
            return false
        }
        if (!creep.room.storage) {
            logError('no storage', creep.name)
            return false
        }
        mem.sourceID = creep.room.storage.id
        return true
    },
    // source:
    source_stage: creep => {
        const mem = creep.memory as FarBuilderMemory
        // 拿满再走
        if (creep.store.getFreeCapacity() <= 0) return true
        // 移动/获取
        const source = Game.getObjectById(mem.sourceID)
        if (source && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            creep.moveTo(source)
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
        // 走到 flag 所在房间
        const flag = Game.flags[mem.targetFlagName]
        if (creep.room != flag.room) {
            creep.moveTo(flag)
            return false
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
}
