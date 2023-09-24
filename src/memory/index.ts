import { logError } from "utils/other"
import { checkStatsMemory } from "./stats"

/* ===== CREEP ===== */
declare global {
    interface CreepMemory {
        role: RoleString
        taskName: string
        // 从孵化开始到准备结束的用时，用于提前自动释放
        readyUsedTime?: number
        // 是否释放了工作位置 (没有的话死后自动释放)
        release?: boolean
        // 是否完成 prepare stage
        ready?: boolean
        // 是否正在 target stage
        working?: boolean
        // 较为通用的内存
        sourceID?: string
        targetID?: string
        // otherID?: string
        sourceFlagName?: string
        targetFlagName?: string
        extraFlagName?: string
        // 物流相关
        // energySourceID?: Id<energySourceType>
        // energyTargetID?: Id<energyTargetType>
        // 是否允许 link 偷取能量
        // allowLink?: boolean
    }
}

function checkCreepMemory() {
    // 在 spawn 保证了 memory 合法性
    return
}

/* ===== FLAG ===== */
declare global {
    interface FlagMemory {
        lairCheck?: boolean
        lairTick?: number
    }
}

function checkFlagMemory() {
}

/* ===== ROOM ===== */
declare global {
    interface RoomStat {
        time: number
        storageEnergy: number
        RCLprogress: number
    }
    interface RoomMemory {
        spawnTaskList: string[]
        // energySourceLocks: { [id: Id<energySourceType>]: number }
        // energyTargetLocks: { [id: Id<energyTargetType>]: number }
        // transferSourceTaskList: TransferSourceTask[]
        // transferTargetTaskList: TransferTargetTask[]
        // 统计量
        nowStat?: RoomStat
        lastStat?: RoomStat
        // 遭到入侵的时间
        invaderTime?: number
        // 集中要刷的墙
        // focusWallID?: Id<StructureWall>
        // 中央 link
        centeralLinkID?: Id<StructureLink>
    }
}

function checkRoomMemory() {
    // 不能直接访问全局 Memory !
    for (const name in Game.rooms) {
        if (!Game.rooms[name].memory.spawnTaskList)
            Game.rooms[name].memory.spawnTaskList = []
        // if (!Game.rooms[name].memory.transferSourceTaskList)
        //     Game.rooms[name].memory.transferSourceTaskList = []
        // if (!Game.rooms[name].memory.transferTargetTaskList)
        //     Game.rooms[name].memory.transferTargetTaskList = []
    }
}

/* ===== GLOBAL ===== */
declare global {
    interface Memory {
        // uuid: number;
        // log: any;
        creepSpawningTaskLiveCount: { [key: string]: number }
    }
}

export function checkMemory() {
    if (!Memory.creepSpawningTaskLiveCount) Memory.creepSpawningTaskLiveCount = {}
    checkStatsMemory()
    checkCreepMemory()
    checkFlagMemory()
    checkRoomMemory()
}

export function releaseCreep(name: string) {
    if (!Memory.creeps[name].release) {
        Memory.creeps[name].release = true
        Memory.creepSpawningTaskLiveCount[Memory.creeps[name].taskName]--
    }
}
