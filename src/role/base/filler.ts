// 将 storage 的 erengy 填充到需要的位置

import { ToN, logError } from "utils/other"

declare global {
    interface FillerData extends EmptyData {
        toID?: Id<StructureSpawn | StructureExtension | StructureTower | StructureTerminal | StructureContainer>
        toPosX?: number
        toPosY?: number
    }
}

function calcTo (creep: Creep, banID?: string) {
    const data = creep.memory.data as FillerData
    let to = data.toID && (data.toID != banID) && Game.getObjectById(data.toID)
    if (!to || to.store.getFreeCapacity(RESOURCE_ENERGY) <= 0 ||
        to.pos.x != data.toPosX || to.pos.y != data.toPosY) to =
        creep.pos.findClosestByPath(creep.room.myTowers(), {
            filter: obj => obj.id != banID && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 100
        }) ||
        creep.pos.findClosestByPath(creep.room.upgradeContainers(), {
            filter: obj => obj.id != banID && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 500
        }) ||
        creep.pos.findClosestByPath(creep.room.mySpawns(), {
            filter: obj => obj.id != banID && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) ||
        creep.pos.findClosestByPath(creep.room.myExtensions(), {
            filter: obj => obj.id != banID && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }) ||
        [creep.room.terminal].find(obj => obj && obj.store[RESOURCE_ENERGY] < 50_000)
    data.toID = to?.id
    data.toPosX = to?.pos.x
    data.toPosY = to?.pos.y
    return to
}

export const fillerLogic: CreepLogic = {
    prepare_stage: creep => {
        // 提前孵化避免没 filler 停摆 (主要是 RCL 低的时候)
        creep.memory.readyUsedTime = ToN(creep.memory.readyUsedTime) + 30
        return true
    },
    source_stage: creep => {
        if (creep.store.getFreeCapacity() <= 0) return true
        const from = creep.findEnergySource()
        if (from) {
            const res = creep.gainResourceFrom(from, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(from)
            else if (res == OK) { // 断定下一步是送能量
                const to = calcTo(creep)
                to && creep.moveTo(to)
            }
            else
                logError("cannot get energy from storage", creep.name)
        }
        return false
    },
    target_stage: creep => {
        const data = creep.memory.data as FillerData
        if (creep.store.getUsedCapacity() <= 0) { delete data.toID; return true }
        const to = calcTo(creep)
        if (to) {
            const res = creep.transfer(to, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res == OK) { // 预测下一步还是送能量
                const nextTo = calcTo(creep, data.toID)
                nextTo && creep.moveTo(nextTo)
            }
            else
                logError("cannot send energy", creep.name)
        }
        return false
    },
}
