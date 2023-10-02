import { logConsole, logError } from "utils/other"

// 一体式开拓新房: claim 控制器 -> 挖矿造 Spawn -> 挖矿填 Spawn / 挖矿 upgrade

declare global {
    interface PioneerData extends EmptyData {
        spawnFlagName: string
        sourceID?: Id<Source>
        jobDone?: boolean
    }
}

export const pioneerLogic: CreepLogic = {
    prepare_stage: creep => {
        const data = creep.memory.data as PioneerData
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
            return false
        }
    },
    source_stage: creep => {
        const data = creep.memory.data as PioneerData
        if (creep.store.getFreeCapacity() <= 0) return true
        let source = data.sourceID && Game.getObjectById(data.sourceID)
        if (!source) {
            const spawnFlag = Game.flags[data.spawnFlagName]
            source = spawnFlag.pos.findClosestByPath(creep.room.sources())
            data.sourceID = source?.id
        }
        if (source) {
            const res = creep.harvest(source)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(source)
            else if (res == OK) {
            }
            else
                logError("cannot harvester", creep.name)
        }
        return false
    },
    target_stage: creep => {
        const data = creep.memory.data as PioneerData
        if (creep.store[RESOURCE_ENERGY] <= 0) return true
        const spawn = creep.room.mySpawns().find(obj => obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
        if (spawn) {
            data.jobDone = true // Spawn 建成开拓的任务就结束了
            const res = creep.transfer(spawn, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE) creep.moveTo(spawn)
            return false
        }
        else {
            const spawnFlag = Game.flags[data.spawnFlagName]
            if (!creep.pos.isNearTo(spawnFlag)) { creep.moveTo(spawnFlag); return false }
            if (creep.pos.isEqualTo(spawnFlag)) { creep.moveRandom(); return false } //  站在上面会导致无法建造
            const sites = spawnFlag.pos.lookFor(LOOK_CONSTRUCTION_SITES)
            if (sites.length <= 0)
                spawnFlag.pos.createConstructionSite(STRUCTURE_SPAWN)
            else
                creep.build(sites[0])
            return false
        }
    },
    stopSpawn: (spawnRoom, memData) => {
        const data = memData as PioneerData
        return data.jobDone ? true : false
    },
}
