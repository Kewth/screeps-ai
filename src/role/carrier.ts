import { logConsole, logError } from "utils/other"

// assumption: 资源只有 energy
// TODO: 物流

type sourceType = StructureContainer | StructureStorage | Tombstone | StructureLink | Resource
type targetType = StructureSpawn | StructureExtension | StructureStorage | StructureTower | StructureTerminal

interface CarrierMemory extends CreepMemory {
    sourceID: Id<sourceType> | undefined
    targetID: Id<targetType> | undefined
}

function calcSourceID(creep: Creep): Id<sourceType> | undefined {
    // 优先 central link
    if (creep.room.memory.centeralLinkID) {
        const link = Game.getObjectById<StructureLink>(creep.room.memory.centeralLinkID)
        if (link && link.store[RESOURCE_ENERGY] > 0)
        return link.id
    }
    // 优先 dropped
    const drop = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES)
    if (drop) return drop.id
    // 优先 tombstone
    const tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
        filter: obj => obj.store.getUsedCapacity() > 0
    })
    if (tombstone) return tombstone.id
    // 其次 container
    const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: obj =>
            obj.structureType == STRUCTURE_CONTAINER &&
            obj.store.getUsedCapacity() >= 1000
    }) as StructureContainer
    if (container) return container.id
    // 实在不行 storage
    const storage = creep.room.storage
    if (storage && storage.store.getUsedCapacity() >= 1000) return storage.id
    // 寄
    logError('no source', creep.name)
    return undefined
}

function calcTarget(creep: Creep): targetType | undefined {
    // 优先补充 tower
    const tower = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: obj =>
            obj.structureType == STRUCTURE_TOWER &&
            obj.store.getFreeCapacity(RESOURCE_ENERGY) > 100
    }) as targetType
    if (tower) return tower
    // 优先补充 spawn/extension
    const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: obj =>
            (obj.structureType == STRUCTURE_EXTENSION ||
                obj.structureType == STRUCTURE_SPAWN) &&
            obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    }) as targetType
    if (target) return target
    // 再次补充 terminal (补充 50k)
    if (creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY] < 50000)
        return creep.room.terminal
    // 只能填 storage 了
    // TODO: 可能 source/target 全在 storage
    if (creep.room.storage) return creep.room.storage
    // 寄
    logError('no target', creep.name)
    return undefined
}

export const carrierLogic: CreepLogic = {
    // source: 从 sourceID 获取能量
    source_stage: creep => {
        const mem = creep.memory as CarrierMemory
        // 拿满再走
        if (creep.store.getFreeCapacity() <= 0) {
            // 清除 sourceID 下次重新搜索
            mem.sourceID = undefined
            return true
        }
        // 检查 sourceID
        const test = mem.sourceID && Game.getObjectById<sourceType>(mem.sourceID)
        if (!test) mem.sourceID = calcSourceID(creep)
        const source = mem.sourceID && Game.getObjectById<sourceType>(mem.sourceID)
        // 移动/获取
        if (source) {
            if (source instanceof Resource) {
                if (creep.pickup(source) == ERR_NOT_IN_RANGE)
                    creep.moveTo(source)
            } else {
                const res = creep.withdraw(source, RESOURCE_ENERGY)
                if (res == ERR_NOT_IN_RANGE)
                    creep.moveTo(source)
                else
                    mem.sourceID = undefined
            }
        }
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
        let target = mem.targetID && Game.getObjectById<targetType>(mem.targetID)
        if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) <= 0)
            target = calcTarget(creep)
        // 移动/传输
        if (target) {
            mem.targetID = target.id
            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                creep.moveTo(target)
            // else if (creep.store[RESOURCE_ENERGY] > target.store.getFreeCapacity(RESOURCE_ENERGY)) {
            //     target = calcTarget(creep)
            //     if (target) {
            //         creep.moveTo(target)
            //         mem.targetID = target.id
            //     }
            // }
        }
        return false
    },
}

export function initCarrierMemory(): CreepMemory {
    return {
        role: 'carrier',
        taskName: 'auto',
    }
}
