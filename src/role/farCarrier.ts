import { logConsole, logError, noInvader } from "utils/other"

// 专注于捡 sourceFlag (即外矿开采位) 的资源
// 只搬到出生房间的 storage (可以在路上 link 捡走)
// 顺便负责修路

type targetType = StructureStorage | StructureLink

interface FarCarrierMemory extends CreepMemory {
    targetID?: Id<targetType>
    sourceFlagName: string // source 开采位
}

export const farCarrierLogic: CreepLogic = {
    // prepare: 走到房间并计算 targetID
    prepare_stage: creep => {
        const mem = creep.memory as FarCarrierMemory
        // storage 备用
        if (!mem.targetID && creep.room.storage)
            mem.targetID = creep.room.storage.id
        // 寻找 link (最后一个经过的 link 就是最终的 targetID)
        const link_list = creep.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: obj => obj.structureType == STRUCTURE_LINK
        }) as StructureLink[]
        if (link_list.length > 0)
            mem.targetID = link_list[0].id
        // 移动
        return creep.goToRoomByFlag(mem.sourceFlagName)
    },
    // source:
    source_stage: creep => {
        const mem = creep.memory as FarCarrierMemory
        // 拿满再走
        if (creep.store.getFreeCapacity() <= 0) return true
        // 躲敌人 (主要是 source keeper)
        if (creep.hits < creep.hitsMax && creep.goAwayEnemy()) return false
        // 获取沿路或者目的地附近的 dropped
        const dropped_list = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
            filter: obj => obj.resourceType == RESOURCE_ENERGY && obj.amount > 30
        })
        if (dropped_list.length > 0) {
            if (creep.pickup(dropped_list[0]) == ERR_NOT_IN_RANGE)
                creep.moveTo(dropped_list[0])
            return false
        }
        // 走到 flag 附近
        const flag = Game.flags[mem.sourceFlagName]
        if (!creep.pos.isNearTo(flag)) {
            creep.moveTo(flag)
            return false
        }
        if (creep.pos.isEqualTo(flag)) {
            creep.moveRandom()
            return false
        }
        // 获取 container
        const container_list = creep.pos.findInRange(FIND_STRUCTURES, 2, {
            filter: obj => obj.structureType == STRUCTURE_CONTAINER
        }) as StructureContainer[]
        if (container_list.length > 0) {
            if (creep.withdraw(container_list[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                creep.moveTo(container_list[0])
        }
        return false
    },
    // target:
    target_stage: creep => {
        const mem = creep.memory as FarCarrierMemory
        // 没了就撤
        if (creep.store.getUsedCapacity() <= 0) return true
        let busy = false
        // 顺道修路 (继续保持移动)
        const road_list = creep.pos.findInRange(FIND_STRUCTURES, 3, {
            filter: obj => obj.structureType == STRUCTURE_ROAD && obj.hits < obj.hitsMax
        }) as StructureRoad[]
        if (!busy && road_list.length > 0) {
            creep.repair(road_list[0])
            busy = true
        }
        // 看到工地建一下 (继续保持移动: farCarrier work 很少所以停下来建造非常影响搬运效率)
        const site_list = creep.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3)
        if (!busy && site_list.length > 0) {
            creep.build(_.min(site_list, obj => obj.progressTotal - obj.progress))
            busy = true
        }
        // 移动/传输
        const target = mem.targetID && Game.getObjectById<targetType>(mem.targetID)
        if (target && creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            creep.moveTo(target)
        return false
    },
    //
    needSpawn: task => {
        const flagName = task.memory.sourceFlagName
        return Boolean(flagName && noInvader(flagName))
    },
}

export function initFarCarrierMemory(sourceFlagName: string): CreepMemory {
    return {
        role: 'farCarrier',
        taskName: 'auto',
        sourceFlagName: sourceFlagName,
    }
}
