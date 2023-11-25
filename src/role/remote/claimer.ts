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
        const res = creep.claimController(ctrl)
        if (res == OK)
            return true
        else {
            creep.attackController(ctrl)
            creep.room.memory.controllerBlockUntil = Game.time + ctrl.upgradeBlocked
            return false
        }
    },
    source_stage: creep => {
        const data = creep.memory.data as ClaimerData
        const spawnFlag = Game.flags[data.spawnFlagName]
        spawnFlag.pos.createConstructionSite(STRUCTURE_SPAWN)
        data.jobDone = true
        creep.say('摸鱼')
        return false
    },
    hangSpawn: (spawnRoom, memData) => {
        const data = memData as ClaimerData
        const spawnFlag = Game.flags[data.spawnFlagName]
        const roomMemory = Memory.rooms[spawnFlag.pos.roomName]
        if (roomMemory && roomMemory.controllerBlockUntil && roomMemory.controllerBlockUntil > Game.time + 500)
            return true
        return false
    },
    stopSpawn: (spawnRoom, memData) => {
        const data = memData as ClaimerData
        return data.jobDone ? true : false
    },
}
