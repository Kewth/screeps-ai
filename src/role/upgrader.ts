import { logConsole, logError } from "utils/other"

// assumption: 房间里有 storage

export const upgraderLogic: CreepLogic = {
    // source: 从 storage 拿能量
    source_stage: creep => {
        const mem = creep.memory
        // 拿满就走
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) return true
        // 检查 sourceID
        const source = creep.room.storage
        // 移动/获取
        if (source && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            creep.moveTo(source)
        return false
    },
    // target: 升级 controller
    target_stage: creep => {
        const mem = creep.memory
        // 没了就撤
        if (creep.store.getUsedCapacity() <= 0) return true
        // 移动/工作
        const target = creep.room.controller
        if (target && creep.upgradeController(target) == ERR_NOT_IN_RANGE)
            creep.moveTo(target)
        return false
    },
}

export function initUpgraderMemory(): CreepMemory {
    return {
        role: 'upgrader',
        taskName: 'auto',
    }
}
