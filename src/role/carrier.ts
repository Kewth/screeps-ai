import { logConsole, logError } from "utils/other"

// assumption: 资源只有 energy
// TODO: 捡 dropped resources

type sourceType = StructureContainer | StructureStorage | Tombstone
type targetType = StructureSpawn | StructureExtension | StructureStorage

interface CarrierMemory extends CreepMemory {
    sourceID: Id<sourceType> | undefined
    targetID: Id<targetType> | undefined
}

function calcSourceID(creep: Creep): Id<sourceType> | undefined {
    // 优先 tombstone
    const tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
        filter: obj => obj.store.getUsedCapacity() > 0
    })
    if (tombstone) return tombstone.id
    // 其次 container
    const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: obj =>
            obj.structureType == STRUCTURE_CONTAINER &&
            obj.store.getUsedCapacity() >= obj.store.getCapacity() * 0.25 // 500
    }) as sourceType
    if (container) return container.id
    // 实在不行 storage
    const storage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: obj =>
            obj.structureType == STRUCTURE_STORAGE &&
            obj.store.getUsedCapacity() >= obj.store.getCapacity() * 0.001 // 1k
    }) as sourceType
    if (storage) return storage.id
    // 寄
    logError('no source', creep.name)
    return undefined
}

function calcTargetID(creep: Creep): Id<targetType> | undefined {
    // 优先补充 spawn/extension
    const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: obj =>
            (obj.structureType == STRUCTURE_EXTENSION ||
                obj.structureType == STRUCTURE_SPAWN) &&
            obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    }) as targetType
    if (target) return target.id
    // 只能填 storage 了
    // TODO: 可能 source/target 全在 storage
    const storage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: obj => obj.structureType == STRUCTURE_STORAGE
    }) as targetType
    if (storage) return storage.id
    // 寄
    logError('no target', creep.name)
    return undefined
}

export const carrierLogic: creepLogic = {
    // source: 从 sourceID 获取能量
    source_stage: creep => {
        const mem = creep.memory as CarrierMemory
        // 拿到就走
        if (creep.store.getUsedCapacity() > 0) {
            // 清除 sourceID 下次重新搜索
            mem.sourceID = undefined
            return true
        }
        // 检查 sourceID
        if (!mem.sourceID) mem.sourceID = calcSourceID(creep)
        if (!mem.sourceID) return false
        const test = Game.getObjectById<sourceType>(mem.sourceID)
        if (!test) mem.sourceID = calcSourceID(creep)
        if (!mem.sourceID) return false
        const source = Game.getObjectById<sourceType>(mem.sourceID)
        // 移动/获取
        if (source && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            creep.moveTo(source)
        return false
    },
    // target: 放到 targetID 里面
    target_stage: creep => {
        const mem = creep.memory as CarrierMemory
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
        if (!test || test.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) mem.targetID = calcTargetID(creep)
        if (!mem.targetID) return false
        const target = Game.getObjectById<targetType>(mem.targetID)
        // 移动/传输
        if (target && creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            creep.moveTo(target)
        // if (target) {
        //     const res = creep.transfer(target, RESOURCE_ENERGY)
        //     if (res == ERR_NOT_IN_RANGE)
        //         creep.moveTo(target)
        //     // 地方满了，下个 tick 换一个 target
        //     if (res == ERR_FULL)
        //         mem.targetID = undefined
        // }
        return false
    },
}

export function initCarrierMemory(): CreepMemory {
    return {
        role: 'carrier',
        taskName: 'auto',
    }
}
