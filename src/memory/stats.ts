import { calcBodyCost } from "utils/bodyConfig"
import { ToN, logConsole } from "utils/other"

const PACK_TICK = 50
const PACK_LIM = 12
const ROOM_PACK = 60 // 3000 tick 存储一次

declare global {
    // interface RoomStat {
    //     time: number
    //     storageEnergy: number
    //     RCLprogress: number
    //     wallHits: number
    // }
    // interface RoomMemory {
    //     nowStat?: RoomStat
    //     lastStat?: RoomStat
    // }
    interface PackStat {
        cpu: number
        spawn: number
    }
    interface Memory {
        stats: {
            gameTick: number
            cpu: number
            credits: number
            creditsIfSold: number
            // storageEnergy: number
            // RCLprogress: number
            GCLprogressPercent: number
            GPLprogressPercent: number
            spawnCost: number
            [otherKey: string]: number
            // R: { [roomName: string]: RoomStatGlobal }
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

function roomStat(room: Room) {
    const terminalEnergy = + ToN(room.terminal?.store[RESOURCE_ENERGY])
    const terminalAll = + ToN(room.terminal?.store.getUsedCapacity())
    const storageEnergy = ToN(room.storage?.store[RESOURCE_ENERGY])
    const storageAll = ToN(room.storage?.store.getUsedCapacity())
    const RCLprogress = ToN(room.controller?.progress)
    const wallHits = _.sum(room.walls(), obj => obj.hits) + _.sum(room.myRamparts(), obj => obj.hits)
    const avgWallHits = wallHits / (room.walls().length + room.myRamparts.length)
    Memory.stats[`${room.name}_terminalEnergy`] = terminalEnergy
    Memory.stats[`${room.name}_terminalAll`] = terminalAll
    Memory.stats[`${room.name}_storageEnergy`] = storageEnergy
    Memory.stats[`${room.name}_storageAll`] = storageAll
    Memory.stats[`${room.name}_RCLprogress`] = RCLprogress
    Memory.stats[`${room.name}_wallHits`] = wallHits
    Memory.stats[`${room.name}_avgWallHits`] = avgWallHits
    // // 输出
    // const stat = room.memory.lastStat || room.memory.nowStat
    // if (stat) {
    //     const interval = Game.time - stat.time
    //     Memory.stats[`${room.name}_storageEnergyPerTick`] = (storageEnergy - stat.storageEnergy) / interval
    //     Memory.stats[`${room.name}_RCLprogressPerTick`] = RCLprogress < stat.RCLprogress
    //         ? RCLprogress / interval
    //         : (RCLprogress - stat.RCLprogress) / interval
    //     Memory.stats[`${room.name}_wallHitsPerTick`] = (wallHits - stat.wallHits) / 100 / interval
    // }
    // // 存储
    // if (Game.time % (ROOM_PACK * PACK_TICK) <= 0) {
    //     room.memory.lastStat = room.memory.nowStat
    //     room.memory.nowStat = {
    //         time: Game.time,
    //         storageEnergy: storageEnergy,
    //         RCLprogress: RCLprogress,
    //         wallHits: wallHits,
    //     }
    // }
}

function globalStat() {
    // logConsole(`pack report: cpu=${Memory.tempPack.cpu}, spawn=${Memory.tempPack.spawn}`)
    Memory.packList.push(Memory.tempPack)
    Memory.tempPack = emptyPack()
    if (Memory.packList.length > PACK_LIM)
        Memory.packList.shift()
    const creditsSold = _.sum(Object.values(Game.market.orders)
        .filter(o => o.type == ORDER_SELL)
        .map(o => o.remainingAmount * o.price))
    Memory.stats = {
        gameTick: Game.time,
        credits: Game.market.credits,
        creditsIfSold: Game.market.credits + creditsSold,
        GCLprogressPercent: Game.gcl.progress * 100 / Game.gcl.progressTotal,
        GPLprogressPercent: Game.gpl.progress * 100 / Game.gpl.progressTotal,
        cpu: _.sum(Memory.packList, p => p.cpu) / (PACK_TICK * Memory.packList.length),
        spawnCost: _.sum(Memory.packList, p => p.spawn) / (PACK_TICK * Memory.packList.length),
    }
}

export function statsMemory() {
    Memory.tempPack.cpu += Game.cpu.getUsed()
    if (Game.time % PACK_TICK > 0) return
    globalStat()
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName]
        if (room.controller?.my) {
            roomStat(room)
        }
    }
}
