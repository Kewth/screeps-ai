import { ClientRequest } from "http"
import { logError } from "utils/other"

// 专职把中央 link 的能量搬到 storage ，有固定的站位

declare global {
    interface LinkTransferData extends EmptyData {
        standFlagName: string
    }
}

type T = StructureStorage | StructureLink | undefined
function calcFromAndTo (creep: Creep): [T, T] {
    const upgradeLink = creep.room.myUpgradeLink()
    const centralLink = creep.room.myCentralLink()
    const reverse = upgradeLink !== undefined && upgradeLink.store[RESOURCE_ENERGY] < 200 &&
        centralLink !== undefined && centralLink.cooldown <= 7
    const from = reverse ? creep.room.storage : centralLink
    const to = reverse ? centralLink : creep.room.storage
    return [from, to]
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
        // 拿到就搬走
        if (creep.store.getUsedCapacity() > 0) return true
        const data = creep.memory.data as LinkTransferData
        // 保证站到 flag 上
        const standFlag = Game.flags[data.standFlagName]
        if (!creep.pos.isEqualTo(standFlag.pos)) { creep.moveTo(standFlag); return false }
        // 判断方向
        const ft = calcFromAndTo(creep)
        const from = ft[0]
        const to = ft[1]
        if (from && from.store[RESOURCE_ENERGY] > 0 && to && to.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            const res = creep.withdraw(from, RESOURCE_ENERGY)
            if (res != OK)
                logError(`cannot get energy: ${res}`, creep.name)
        }
        else
            creep.sleep(3)
        return false
    },
    target_stage: creep => {
        if (creep.store.getUsedCapacity() <= 0) return true
        const ft = calcFromAndTo(creep)
        const from = ft[0]
        const to = ft[1]
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
