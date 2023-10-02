import { logError } from "utils/other";

declare global {
    interface RemoteHarvesterData extends EmptyData {
        workFlagName: string
        buildFlagName: string
        sourceID?: Id<Source>
        containerID?: Id<StructureContainer>
    }
}

export const remoteHarvesterLogic: CreepLogic = {
    // prepare:
    prepare_stage: creep => {
        const data = creep.memory.data as RemoteHarvesterData
        const workFlag = Game.flags[data.workFlagName]
        if (!workFlag) { logError('no workFlag', creep.name); return false }
        // 移动到 flag 所在房间
        if (!creep.goToRoom(workFlag.pos.roomName)) return false
        // 检查 flag 周边 source
        const nearSources = workFlag.pos.findInRange(FIND_SOURCES, 1)
        if (nearSources.length <= 0) { logError('no source', creep.name); return false }
        data.sourceID = nearSources[0].id
        // 不需要移动到 flag 就直接转 stage ，这样做可以躲敌人
        return true
    },
    // source:
    source_stage: creep => {
        const data = creep.memory.data as RemoteHarvesterData
        // 躲敌人 (主要是 source keeper)
        if (creep.hits < creep.hitsMax && creep.goAwayHostileCreeps()) return false
        // 走到工位
        const workFlag = Game.flags[data.workFlagName]
        if (!creep.pos.isEqualTo(workFlag)) { creep.moveTo(workFlag); return false }
        // 检查 container 以及 source
        const container = data.containerID && Game.getObjectById(data.containerID)
        const source = data.sourceID && Game.getObjectById(data.sourceID)
        if (!source) return false
        // 没有 container ，把自己挖满就转 stage
        if (!container) {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) return true
            creep.harvest(source)
        }
        // 有 container 并且没满，负责维修一下然后开挖
        else if (container.store.getFreeCapacity() > 0) {
            if (container.hits < container.hitsMax - 1000) {
                if (creep.store[RESOURCE_ENERGY] < 25)
                    creep.harvest(source)
                else
                    creep.repair(container)
            } else {
                creep.transfer(container, RESOURCE_ENERGY)
                creep.harvest(source)
            }
        }
        // 有 container 并且满了
        else {
            // 不挖了，挖了意义不大，会加速 invader 入侵
        }
        return false
    },
    // target:
    target_stage: creep => {
        const data = creep.memory.data as RemoteHarvesterData
        // 躲敌人 (主要是 source keeper)
        if (creep.hits < creep.hitsMax && creep.goAwayHostileCreeps()) return false
        // 走到工位
        const workFlag = Game.flags[data.workFlagName]
        if (!creep.pos.isEqualTo(workFlag)) { creep.moveTo(workFlag); return false }
        // 没能量了
        if (creep.store[RESOURCE_ENERGY] <= 0) return true
        // 建 container
        const buildFlag = Game.flags[data.buildFlagName]
        const containers = buildFlag.pos.lookFor(LOOK_STRUCTURES).filter(
            obj => obj.structureType == STRUCTURE_CONTAINER
        ) as StructureContainer[]
        if (containers.length > 0) { data.containerID = containers[0].id; return true }
        const sites = buildFlag.pos.lookFor(LOOK_CONSTRUCTION_SITES)
        if (sites.length <= 0) {
            buildFlag.pos.createConstructionSite(STRUCTURE_CONTAINER)
            return false
        }
        creep.build(sites[0])
        return false
    },
    hangSpawn: (spawnRoom, memData) => {
        const data = memData as RemoteHarvesterData
        const workFlag = Game.flags[data.workFlagName]
        if (!workFlag) return true // 没有旗帜 (?)
        const targetRoom = Game.rooms[workFlag.pos.roomName]
        if (!targetRoom) return true // 没有视野
        if (targetRoom.enemyOrInvaderCreeps().length > 0) return true // 房间里有危险
        return false
    }
}
