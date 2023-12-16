import { logError } from "utils/other"

declare global {
    interface ClaimerData extends EmptyData {
        spawnFlagName: string
        jobDone?: boolean
    }
}

export const claimerLogic: CreepLogic = {
    prepare_stage: creep => {
        const data = creep.memory.data as ClaimerData
        const spawnFlag = Game.flags[data.spawnFlagName]
        if (!spawnFlag) { logError('no spawnFlag', creep.name); return false }
        if (creep.hits < creep.hitsMax) creep.heal(creep)
        if (!creep.goToRoom(spawnFlag.pos.roomName)) return false
        // 移动到 controller
        const ctrl = creep.room.controller
        if (!ctrl) { logError("no controller", creep.name); return false }
        if (ctrl.my) return true
        if (!creep.pos.isNearTo(ctrl)) { creep.moveTo(ctrl); return false }
        // claim 它
        const resp = creep.claimController(ctrl)
        if (resp == OK)
            return false // 下个 tick 再检查一次 ctrl.my
        else {
            const resp = creep.attackController(ctrl)
            if (resp == OK) creep.signController(ctrl, 'It will be cliamed by Kewth')
            creep.room.memory.controllerBlockUntil = Game.time + ctrl.upgradeBlocked
            return false
        }
    },
    source_stage: creep => {
        const data = creep.memory.data as ClaimerData
        const spawnFlag = Game.flags[data.spawnFlagName]
        creep.room.controller && creep.signController(creep.room.controller, '')
        spawnFlag.pos.createConstructionSite(STRUCTURE_SPAWN)
        data.jobDone = true
        return true
    },
    target_stage: creep => {
        creep.sleep(100)
        return false
    },
    checkSpawn: (spawnRoom, mixData) => {
        const data = mixData as ClaimerData
        if (data.jobDone) return 'stop'
        const spawnFlag = Game.flags[data.spawnFlagName]
        const roomMemory = Memory.rooms[spawnFlag.pos.roomName]
        if (roomMemory && roomMemory.controllerBlockUntil && roomMemory.controllerBlockUntil > Game.time + 500)
            return 'hang'
        return 'spawn'
    },
    // hangSpawn: (spawnRoom, memData) => {
    //     const data = memData as ClaimerData
    //     const spawnFlag = Game.flags[data.spawnFlagName]
    //     const roomMemory = Memory.rooms[spawnFlag.pos.roomName]
    //     if (roomMemory && roomMemory.controllerBlockUntil && roomMemory.controllerBlockUntil > Game.time + 500)
    //         return true
    //     return false
    // },
    // stopSpawn: (spawnRoom, memData) => {
    //     const data = memData as ClaimerData
    //     return data.jobDone ? true : false
    // },
}
