/*
declare global {
    var energySourceList: { [roomName: string]: energySourceType[] }
    var energyTargetList: { [roomName: string]: energyTargetType[] }
}

const source_priority_tombstone = 4
const source_priority_link = 3
const source_priority_container = 2
const source_priority_storage = 1

const target_priority_tower = 4
const target_priority_spawn = 3
const target_priority_extension = 2
const target_priority_storage = 1

var updateTime: number = 0
export function roomUpdateEnergyTransfer(room: Room): void {
    if (Game.time == updateTime) return
    updateTime = Game.time
    // === source check ===
    interface SourceTask {
        obj: energySourceType
        priority: number
        ex_locks?: number
    }
    let sourceList: SourceTask[] = []
    room.find(FIND_TOMBSTONES).forEach(obj => {
        if (obj.store[RESOURCE_ENERGY] > 0) {
            sourceList.push({ obj: obj, priority: source_priority_tombstone })
        }
    })
    room.find(FIND_STRUCTURES).forEach(obj => {
        switch(obj.structureType) {
            case STRUCTURE_CONTAINER:
                if (obj.store[RESOURCE_ENERGY] > 500)
                    sourceList.push({ obj, priority: source_priority_container })
                break
            case STRUCTURE_LINK:
                if (obj.id == room.memory.centeralLinkID && obj.store[RESOURCE_ENERGY] > 0)
                    sourceList.push({ obj, priority: source_priority_link })
                break
            case STRUCTURE_STORAGE:
                if (obj.store[RESOURCE_ENERGY] > 1000)
                    sourceList.push({ obj, priority: source_priority_storage, ex_locks: 100 })
                break
        }
    })
    sourceList.forEach(t => {
        if (!room.memory.energySourceLocks[t.obj.id])
            room.memory.energySourceLocks[t.obj.id] = 1 + (t.ex_locks ? t.ex_locks : 0)
    })
    energySourceList[room.name] = sourceList.sort((a, b) => a.priority - b.priority).map(t => t.obj)
    // === target check ===
    interface TargetTask {
        obj: energyTargetType
        priority: number
        ex_locks?: number
    }
    let targetList: TargetTask[] = []
    room.find(FIND_STRUCTURES).forEach(obj => {
        switch(obj.structureType) {
            case STRUCTURE_SPAWN:
                if (obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                    targetList.push({ obj: obj, priority: target_priority_spawn })
                break
            case STRUCTURE_EXTENSION:
                if (obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                    targetList.push({ obj: obj, priority: target_priority_extension })
                break
            case STRUCTURE_TOWER:
                if (obj.store.getFreeCapacity(RESOURCE_ENERGY) > 100)
                    targetList.push({ obj: obj, priority: target_priority_tower })
                break
            case STRUCTURE_STORAGE: // 假设不满
                sourceList.push({ obj, priority: target_priority_storage, ex_locks: 100 })
                break
        }
    })
    targetList.forEach(t => {
        if (!room.memory.energyTargetLocks[t.obj.id])
            room.memory.energyTargetLocks[t.obj.id] = 1 + (t.ex_locks ? t.ex_locks : 0)
    })
    energyTargetList[room.name] = targetList.sort((a, b) => a.priority - b.priority).map(t => t.obj)
}
*/
