import { calcBodyCost, logConsole } from "utils/other"

const PACK_TICK = 50
const PACK_LIM = 12

declare global {
    interface PackStat {
        cpu: number
        spawn: number
    }
    interface Memory {
        stats: {
            time: number
            cpu: number
            storageEnergy: number
            RCLprogress: number
            spawnCost: number
        }
        packList: PackStat[]
        tempPack: PackStat
    }
}

function emptyPack (): PackStat {
    return {
        cpu: 0,
        spawn: 0,
    }
}

export function checkStatsMemory () {
    if (!Memory.packList) Memory.packList = []
    if (!Memory.tempPack) Memory.tempPack = emptyPack()
}

export function addStat_spawn(b: BodyPartConstant[]) {
    Memory.tempPack.spawn += calcBodyCost(b)
}

export function statsMemory() {
    //
    Memory.tempPack.cpu += Game.cpu.getUsed()
    //
    if (Game.time % PACK_TICK > 0) return
    logConsole(`pack report: cpu=${Memory.tempPack.cpu}, spawn=${Memory.tempPack.spawn}`)
    Memory.packList.push(Memory.tempPack)
    Memory.tempPack = emptyPack()
    if (Memory.packList.length > PACK_LIM)
        Memory.packList.shift()
    // 统计
    let storageEnergy = 0
    let RCLprogress = 0
    for (const name in Game.rooms) {
        const room = Game.rooms[name]
        if (room.controller && room.controller.my) {
            RCLprogress += room.controller.progress
            if (room.storage) storageEnergy += room.storage.store.getUsedCapacity(RESOURCE_ENERGY)
        }
    }
    //
    Memory.stats = {
        time: Game.time,
        storageEnergy: storageEnergy,
        RCLprogress: RCLprogress,
        cpu: _.sum(Memory.packList, p => p.cpu) / (PACK_TICK * Memory.packList.length),
        spawnCost: _.sum(Memory.packList, p => p.spawn) / (PACK_TICK * Memory.packList.length),
    }
}
