import { logError } from "utils/other"

declare global {
    interface RemoteHelperData extends EmptyData {
        targetRoomName: string
        toID?: Id<ConstructionSite | StructureController>
    }
}

function calcTo (creep: Creep) {
    const data = creep.memory.data as RemoteHelperData
    let to = data.toID && Game.getObjectById(data.toID)
    if (!to) to =
        creep.pos.findClosestByRange(creep.room.myConstructionSites()) ||
        creep.room.controller
    data.toID = to?.id
    return to
}

export const remoteHelperLogic: CreepLogic = {
    prepare_stage: creep => {
        const data = creep.memory.data as RemoteHelperData
        return creep.goToRoom(data.targetRoomName)
    },
    source_stage: creep => {
        if (creep.store.getFreeCapacity() <= 0) return true
        // 使用别人剩下的 storage
        const storage = creep.room.storage
        const from = storage && storage.store[RESOURCE_ENERGY] > 0 ? storage : creep.findEnergySource()
        if (from) {
            const resp = creep.gainResourceFrom(from, RESOURCE_ENERGY)
            if (resp == ERR_NOT_IN_RANGE)
                creep.moveTo(from)
            else if (resp != OK)
                logError(`cannot get energy: ${resp}`, creep.name)
        }
        else {
            // TODO: 挖矿
            logError(`no source`, creep.name)
        }
        return false
    },
    target_stage: creep => {
        const data = creep.memory.data as RemoteHelperData
        if (creep.store[RESOURCE_ENERGY] <= 0) { delete data.toID; return true }
        const to = calcTo(creep)
        if (to) {
            const res = to instanceof StructureController ? creep.upgradeController(to) : creep.build(to)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res != OK)
                logError(`cannot work: ${res}`, creep.name)
        }
        return false
    },
    hangSpawn: (spawnRoom, memData) => {
        const data = memData as RemoteHelperData
        const room = Game.rooms[data.targetRoomName]
        if (!room) return true
        if (room.enemyOrInvaderCreeps().length > 0) return true
        if (!room.myController()) return true
        return false
    },
    stopSpawn: (spawnRoom, memData) => {
        const data = memData as RemoteHelperData
        const room = Game.rooms[data.targetRoomName]
        const ctrl = room?.myController()
        const storage = room?.storage
        if (ctrl && storage && storage.my) return true
        return false
    }
}
