import { logError } from "utils/other"

// 专职把中央 link 的能量搬到 storage

declare global {
    interface LinkTransferData extends EmptyData {
    }
}

export const linkTransferLogic: CreepLogic = {
    source_stage: creep => {
        const data = creep.memory.data as LinkTransferData
        // 拿到就搬走
        if (creep.store.getFreeCapacity() > 0) return true
        const link = creep.room.centralLink()
        if (link && link.store[RESOURCE_ENERGY] > 0) {
            const res = creep.withdraw(link, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(link)
            else if (res == OK) { // 下一步转到 storage
                creep.room.storage && creep.moveTo(creep.room.storage)
            }
            else
                logError(`cannot get energy from link: ${res}`, creep.name)
        }
        return false
    },
    target_stage: creep => {
        if (creep.store.getUsedCapacity() <= 0) return true
        const storage = creep.room.storage
        if (storage) {
            const res = creep.transfer(storage, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(storage)
            else if (res == OK) { // 下一步是拿资源
                const link = creep.room.centralLink()
                link && creep.moveTo(link)
            }
            else
                logError(`cannot send energy to storage: ${res}`, creep.name)
        }
        return false
    }
}
