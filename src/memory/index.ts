/* ===== CREEP ===== */
declare global {
    interface CreepMemory {
        role: RoleString
        taskName: string
        // room: string
        ready?: boolean // 默认 false
        working?: boolean // 默认 false
        sourceID?: string
        targetID?: string
        sourceFlagName?: string
        targetFlagName?: string
        tickStore?: number
    }
}

function checkCreepMemory() {
    // 在 spawn 保证了 memory 合法性
    return
}

/* ===== FLAG ===== */
declare global {
    interface FlagMemory {
    }
}

function checkFlagMemory() {
}

/* ===== ROOM ===== */
declare global {
    interface RoomMemory {
        spawnTaskList: string[]
    }
}

function checkRoomMemory() {
    // 不能直接访问全局 Memory !
    for (const name in Game.rooms)
        if (!Game.rooms[name].memory.spawnTaskList)
            Game.rooms[name].memory.spawnTaskList = []
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
    checkCreepMemory()
    checkFlagMemory()
    checkRoomMemory()
}
