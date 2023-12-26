import { logError, myMax } from "utils/other"

declare global {
    interface RemoteHelperData extends EmptyData {
        targetRoomName: string
        toID?: Id<ConstructionSite | StructureController>
        sourceID?: Id<Source>
    }
}

function calcSource (creep: Creep) {
    const data = creep.memory.data as RemoteHelperData
    let source = data.sourceID && Game.getObjectById(data.sourceID)
    if (!source) source =
        myMax(creep.room.sources(), s => s.energy)
    data.sourceID = source?.id
    return source
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
        const useSource = creep.room.mySpawns().length <= 0
        // 不是挖矿的话拿到能量就走，因为自己容量比较大，一直等会影响其他爬爬的能量获取
        if (creep.store.getFreeCapacity() <= 0 ||
            (!useSource && creep.store[RESOURCE_ENERGY] > 0)
        ) {
            const data = creep.memory.data as RemoteHelperData
            delete data.sourceID
            return true
        }
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
        else if (useSource) {
            const source = calcSource(creep)
            if (source) {
                const resp = creep.harvest(source)
                if (resp == ERR_NOT_IN_RANGE)
                    creep.moveTo(source)
            }
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
    checkSpawn: (spawnRoom, mixData) => {
        const data = mixData as RemoteHelperData
        const room = Game.rooms[data.targetRoomName]
        if (!room || !room.myController()) return 'hang'
        const storage = room.storage
        if (storage && storage.my) return 'stop'
        if (room.enemyOrInvaderCreeps().length > 0) return 'hang'
        return 'spawn'
    },
}
