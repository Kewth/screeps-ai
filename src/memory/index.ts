import { checkStatsMemory } from "./stats"

/* ===== CREEP ===== */
declare global {
    interface CreepMemory {
        // 角色名
        role: RoleConstant
        // creep 自己需要的数据
        data: CreepData
        // config 名
        configName: string
        // 从孵化开始到准备结束的用时，用于提前孵化
        readyUsedTime?: number
        // 是否已经重新孵化
        reSpawnAlready?: boolean
        // 是否完成 prepare stage
        ready?: boolean
        // 是否正在 target stage
        working?: boolean
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
        // filler 停摆的时间
        noFillerTickCount: number
    }
}

function checkRoomMemory() {
    // 不能直接访问全局 Memory !
    for (const name in Game.rooms) {
        if (!Game.rooms[name].memory.spawnTaskList)
            Game.rooms[name].memory.spawnTaskList = []
        if (!Game.rooms[name].memory.noFillerTickCount)
            Game.rooms[name].memory.noFillerTickCount = 0
        // if (!Game.rooms[name].memory.transferSourceTaskList)
        //     Game.rooms[name].memory.transferSourceTaskList = []
        // if (!Game.rooms[name].memory.transferTargetTaskList)
        //     Game.rooms[name].memory.transferTargetTaskList = []
    }
}

/* ===== GLOBAL ===== */
declare global {
    interface CreepConfig {
        spawnRoomName: string
        role: RoleConstant
        data: CreepData
        gBodyConf: GeneralBodyConfig
        num: number
        live: number
        priority: number
    }
    interface Memory {
        creepConfigs: { [name: string]: CreepConfig }
    }
}

export function checkMemory() {
    if (!Memory.creepConfigs) Memory.creepConfigs = {}
    checkStatsMemory()
    checkCreepMemory()
    checkFlagMemory()
    checkRoomMemory()
}
