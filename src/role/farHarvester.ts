import { logError, noInvader } from "utils/other"
import { harvesterLogic } from "./harvester"

interface FarHarvesterMemory extends CreepMemory {
    sourceID: Id<Source>
    sourceFlagName: string // 开采位置
    // targetID?: Id<StructureContainer>
    targetFlagName?: string // container 建造位置 (默认 sourceFlag 原地)
}

export const farHarvesterLogic: CreepLogic = {
    // prepare:
    prepare_stage: creep => {
        const mem = creep.memory as FarHarvesterMemory
        if (!creep.goToRoomByFlag(mem.sourceFlagName)) return false
        const flag = Game.flags[mem.sourceFlagName]
        const source_list = flag.pos.findInRange(FIND_SOURCES, 1)
        if (source_list.length <= 0) {
            logError('no source', creep.name)
            return false
        }
        if (source_list.length > 1)
            logError('too many source', creep.name)
        mem.sourceID = source_list[0].id
        return true
    },
    // source:
    source_stage: creep => {
        const mem = creep.memory as FarHarvesterMemory
        // 躲敌人 (主要是 source keeper)
        if (creep.hits < creep.hitsMax && creep.goAwayEnemy()) return false
        // 走到工位
        const flag = Game.flags[mem.sourceFlagName]
        if(!creep.pos.isEqualTo(flag)) {
            creep.moveTo(flag)
            return false
        }
        // 检查周边 container 获取 source
        const near_containers = creep.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: obj => obj.structureType == STRUCTURE_CONTAINER
        }) as StructureContainer[]
        const source = Game.getObjectById<Source>(mem.sourceID)
        if (!source) return false
        // 周边没有 container
        if (near_containers.length <= 0) {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) return true
            creep.harvest(source)
            return false
        }
        // 周边有 container
        const free_container = near_containers.find(obj => obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
        if (free_container) {
            if (free_container.hits < free_container.hitsMax - 1000) {
                // 负责维修 container
                if (creep.store[RESOURCE_ENERGY] < 25)
                    creep.harvest(source)
                else
                    creep.repair(free_container)
            } else {
                creep.transfer(free_container, RESOURCE_ENERGY)
                creep.harvest(source)
            }
        }
        else {
            // container 满了就不挖了，挖了也只是加速 invader 入侵而已
            // creep.harvest(source)
        }
        return false
    },
    // target:
    target_stage: creep => {
        const mem = creep.memory as FarHarvesterMemory
        // 躲敌人 (主要是 source keeper)
        if (creep.hits < creep.hitsMax && creep.goAwayEnemy()) return false
        // 走到工位
        const flag = Game.flags[mem.sourceFlagName]
        if(!creep.pos.isEqualTo(flag)) {
            creep.moveTo(flag)
            return false
        }
        // 没能量了
        if (creep.store[RESOURCE_ENERGY] <= 0) return true
        // 建 container
        const containerFlag = Game.flags[mem.targetFlagName || mem.sourceFlagName]
        if (containerFlag.pos.lookFor(LOOK_STRUCTURES).length > 0) return true
        const sites = containerFlag.pos.lookFor(LOOK_CONSTRUCTION_SITES)
        if (sites.length <= 0) {
            containerFlag.pos.createConstructionSite(STRUCTURE_CONTAINER)
            return false
        }
        if (sites.length != 1) logError("too many construction sites?", creep.name)
        creep.build(sites[0])
        return false
    },
    //
    needSpawn: task => {
        const flagName = task.memory.sourceFlagName
        return Boolean(flagName && noInvader(flagName))
    },
}

export function initFarHarvesterMemory(sourceFlagName: string, targetFlagName?: string): CreepMemory {
    return {
        role: 'farHarvester',
        taskName: 'auto',
        sourceFlagName: sourceFlagName,
        targetFlagName: targetFlagName,
    }
}
