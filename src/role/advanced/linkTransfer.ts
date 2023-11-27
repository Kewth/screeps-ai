import { ClientRequest } from "http"
import { logError } from "utils/other"

// 专职把中央 link 的能量搬到 storage ，有固定的站位

declare global {
    interface LinkTransferData extends EmptyData {
        standFlagName: string
    }
}

export const linkTransferLogic: CreepLogic = {
    prepare_stage: creep => {
        const data = creep.memory.data as LinkTransferData
        const standFlag = Game.flags[data.standFlagName]
        if (standFlag) {
            if (!creep.pos.isEqualTo(standFlag)) {
                creep.moveTo(standFlag)
                return false
            }
        }
        return true
    },
    source_stage: creep => {
        // const data = creep.memory.data as LinkTransferData
        // 拿到就搬走
        if (creep.store.getUsedCapacity() > 0) return true
        const upgradeLink = creep.room.myUpgradeLink()
        const centralLink = creep.room.myCentralLink()
        const reverse = upgradeLink !== undefined && upgradeLink.store[RESOURCE_ENERGY] < 200 &&
            centralLink !== undefined && centralLink.cooldown <= 0
        const from = reverse ? creep.room.storage : centralLink
        const to = reverse ? centralLink : creep.room.storage
        if (from && from.store[RESOURCE_ENERGY] > 0) {
            const res = creep.withdraw(from, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(from)
            else if (res == OK) {
                to && creep.moveTo(to)
            }
            else
                logError(`cannot get energy: ${res}`, creep.name)
        }
        else
            creep.sleep(5)
        return false
    },
    target_stage: creep => {
        if (creep.store.getUsedCapacity() <= 0) return true
        const upgradeLink = creep.room.myUpgradeLink()
        const centralLink = creep.room.myCentralLink()
        const reverse = upgradeLink !== undefined && upgradeLink.store[RESOURCE_ENERGY] < 200 &&
            centralLink !== undefined && centralLink.cooldown <= 0
        const from = reverse ? creep.room.storage : centralLink
        const to = reverse ? centralLink : creep.room.storage
        if (to) {
            const res = creep.transfer(to, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res == OK) { // 下一步是拿资源
                from && creep.moveTo(from)
            }
            else
                logError(`cannot send energy: ${res}`, creep.name)
        }
        return false
    }
}
