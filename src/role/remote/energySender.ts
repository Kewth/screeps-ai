import { logError } from "utils/other"

declare global {
    interface EnergySenderData extends EmptyData {
        sourceRoomName: string
        targetRoomName: string
    }
}

export const energySenderLogic: CreepLogic = {
    source_stage: creep => {
        if (creep.store.getFreeCapacity() <= 0) return true
        const data = creep.memory.data as EnergySenderData
        if (!creep.goToRoom(data.sourceRoomName)) return false
        const storage = creep.room.storage
        if (storage) {
            const resp = creep.withdraw(storage, RESOURCE_ENERGY)
            if (resp == ERR_NOT_IN_RANGE)
                creep.moveTo(storage)
            else if (resp != OK)
                logError(`cannot get energy: ${resp}`, creep.name)
        }
        return false
    },
    target_stage: creep => {
        const data = creep.memory.data as EnergySenderData
        if (creep.store[RESOURCE_ENERGY] <= 0) return true
        if (!creep.goToRoom(data.targetRoomName)) return false
        const storage = creep.room.storage
        if (storage) {
            const resp = creep.transfer(storage, RESOURCE_ENERGY)
            if (resp == ERR_NOT_IN_RANGE)
                creep.moveTo(storage)
            else if (resp != OK)
                logError(`cannot transfer energy: ${resp}`, creep.name)
        }
        return false
    },
    hangSpawn: (spawnRoom, memData) => {
        const data = memData as EnergySenderData
        const room = Game.rooms[data.sourceRoomName]
        if (!room) return true
        if (!room.storage) return true
        if (room.storage.lowEnergy()) return true
        return false
    },
    stopSpawn: (spawnRoom, memData) => {
        const data = memData as EnergySenderData
        const room = Game.rooms[data.targetRoomName]
        if (room?.terminal?.my) return true
        return false
    }
}
