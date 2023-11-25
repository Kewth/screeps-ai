import { logError } from "utils/other"

declare global {
    interface RemoteHelperData extends EmptyData {
        sourceRoomName: string
        targetRoomName: string
        toID?: Id<ConstructionSite>
    }
}

// TODO: 搬 storage

function calcTo (creep: Creep) {
    const data = creep.memory.data as RemoteHelperData
    let to = data.toID && Game.getObjectById(data.toID)
    if (!to) to =
        creep.pos.findClosestByPath(creep.room.myConstructionSites())
    data.toID = to?.id
    return to
}

export const remoteHelperLogic: CreepLogic = {
    source_stage: creep => {
        const data = creep.memory.data as RemoteHelperData
        if (creep.store.getFreeCapacity() <= 0) return true
        if (!creep.goToRoom(data.sourceRoomName)) return false
        const from = creep.findEnergySource()
        if (from) {
            const res = creep.gainResourceFrom(from, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(from)
            else if (res == OK)
                creep.goToRoom(data.targetRoomName)
            else
                logError(`cannot get energy: ${res}`, creep.name)
        }
        return false
    },
    target_stage: creep => {
        const data = creep.memory.data as RemoteHelperData
        if (creep.store[RESOURCE_ENERGY] <= 0) { delete data.toID; return true }
        if (!creep.goToRoom(data.targetRoomName)) return false
        const to = calcTo(creep)
        if (to) {
            const res = creep.build(to)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res == OK) {
            }
            else
                logError(`cannot build: ${res}`, creep.name)
        }
        return false
    },
    hangSpawn: (spawnRoom, memData) => {
        const data = memData as RemoteHelperData
        const room = Game.rooms[data.targetRoomName]
        if (!room) return true
        if (room.enemyOrInvaderCreeps().length > 0) return true
        if (!room.controller) return true
        if (!room.controller.my) return true
        return false
    },
    stopSpawn: (spawnRoom, memData) => {
        const data = memData as RemoteHelperData
        const room = Game.rooms[data.targetRoomName]
        if (room && room.myConstructionSites().length <= 0) return true
        return false
    }
}
