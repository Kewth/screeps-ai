import { logConsole, logError } from "utils/other"

// 专注于捡 sourceFlag (即外矿开采位) 的资源
// 只搬到出生房间的 storage

type targetType = StructureStorage

interface FarCarrierMemory extends CreepMemory {
    targetID: Id<targetType>
    sourceFlagName: string
}

export const farCarrierLogic: creepLogic = {
    // prepare: 计算 targetID
    prepare_stage: creep => {
        const mem = creep.memory as FarCarrierMemory
        if (!mem.sourceFlagName) {
            logError('no sourceFlagName', creep.name)
            return false
        }
        if (!creep.room.storage) {
            logError('no storage', creep.name)
            return false
        }
        mem.targetID = creep.room.storage.id
        return true
    },
    // source:
    source_stage: creep => {
        const mem = creep.memory as FarCarrierMemory
        // 拿满再走
        if (creep.store.getFreeCapacity() <= 0) return true
        // 走到 flag 附近
        const flag = Game.flags[mem.sourceFlagName]
        if (!creep.pos.isNearTo(flag)) {
            creep.moveTo(flag)
            return false
        }
        // 获取 dropped/container
        const dropped_list = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1)
        if (dropped_list.length > 0) {
            creep.pickup(dropped_list[0])
            return false
        }
        const container_list = creep.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: obj => obj.structureType == STRUCTURE_CONTAINER
        }) as StructureContainer[]
        if (container_list.length > 0) {
            creep.withdraw(container_list[0], RESOURCE_ENERGY)
        }
        return false
    },
    // target:
    target_stage: creep => {
        const mem = creep.memory as FarCarrierMemory
        // 没了就撤
        if (creep.store.getUsedCapacity() <= 0) return true
        // 检查 targetID
        const target = Game.getObjectById<targetType>(mem.targetID)
        // 移动/传输
        if (target && creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            creep.moveTo(target)
        return false
    },
}
