import { calcBodyCost } from "utils/bodyConfig"
import { ToN, logConsole } from "utils/other"

const PACK_TICK = 50
const PACK_LIM = 12

declare global {
    interface PackStat {
        cpu: number
        roomCpu: { [roomName: string]: number }
        roomCreepCpu: { [roomName: string]: number }
    }
    interface Memory {
        stats: {
            gameTick: number
            cpu: number
            credits: number
            creditsIfSold: number
            GCLprogressPercent: number
            GPLprogressPercent: number
            [otherKey: string]: number
        }
        packList: PackStat[]
        tempPack: PackStat
    }
}

function emptyPack (): PackStat {
    return {
        cpu: 0,
        roomCpu: {},
        roomCreepCpu: {},
    }
}

export function checkStatsMemory () {
    if (!Memory.packList) Memory.packList = []
    if (!Memory.tempPack) Memory.tempPack = emptyPack()
}

export function addStat_spawn(b: BodyPartConstant[]) {
    // Memory.tempPack.spawn += calcBodyCost(b)
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
    Memory.stats[`${room.name}_cpu`] = _.sum(Memory.packList, p => p.roomCpu[room.name]) / (PACK_TICK * Memory.packList.length)
    Memory.stats[`${room.name}_creepCpu`] = _.sum(Memory.packList, p => p.roomCreepCpu[room.name]) / (PACK_TICK * Memory.packList.length)
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
