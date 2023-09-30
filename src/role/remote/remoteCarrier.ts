import { logError } from "utils/other";

// 专注于捡 sourceFlag (即外矿开采位) 的资源
// 只搬到出生房间的 storage (可以在路上 link 捡走)
// 顺便负责修路

declare global {
    interface RemoteCarrierData extends EmptyData {
        containerFlagName: string
        toID?: Id<StructureStorage | StructureLink>
    }
}

export const remoteCarrierLogic: CreepLogic = {
    prepare_stage: creep => {
        const data = creep.memory.data as RemoteCarrierData
        // storage 备用
        if (!data.toID && creep.room.storage)
            data.toID = creep.room.storage.id
        // 寻找 link (最后一个经过的 link 就是最终的 toID)
        const links = creep.pos.findInRange(creep.room.myLinks(), 1)
        if (links.length > 0) data.toID = links[0].id
        // 移动
        const containerFlag = Game.flags[data.containerFlagName]
        if (!containerFlag) { logError('no containerFlag', creep.name); return false }
        return creep.goToRoom(containerFlag.pos.roomName)
    },
    // source:
    source_stage: creep => {
        const data = creep.memory.data as RemoteCarrierData
        if (creep.store.getFreeCapacity() <= 0) return true
        // 躲敌人 (主要是 source keeper)
        if (creep.hits < creep.hitsMax && creep.goAwayHostileCreeps()) return false
        // 获取沿路或者目的地附近的 dropEnergy
        const drop = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 3)
            .find(obj => obj.resourceType == RESOURCE_ENERGY && obj.amount > 30)
        const containerFlag = Game.flags[data.containerFlagName]
        if (drop) {
            const res = creep.pickup(drop)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(drop)
            else if (res == OK)
                creep.moveTo(containerFlag)
            else
                logError("cannot pick energy", creep.name)
            return false
        }
        // 走到 flag 附近
        if (!creep.pos.isNearTo(containerFlag)) { creep.moveTo(containerFlag); return false }
        // 获取 container
        const container = containerFlag.pos.lookFor(LOOK_STRUCTURES).find(
            obj => obj.structureType == STRUCTURE_CONTAINER
        ) as StructureContainer | undefined
        if (!container || container.store[RESOURCE_ENERGY] <= 0) {
            // container 空了，跑路，避免堵塞 (但是不能直接转 stage ，因为可能自己 carry 是空的转了又转回来)
            const to = data.toID && Game.getObjectById(data.toID)
            to && creep.moveTo(to)
            return false
        }
        const res = creep.withdraw(container, RESOURCE_ENERGY)
        if (res == OK) {
            const to = data.toID && Game.getObjectById(data.toID)
            to && creep.moveTo(to)
        }
        else
            logError("cannot get energy", creep.name)
        return false
    },
    // target:
    target_stage: creep => {
        const data = creep.memory.data as RemoteCarrierData
        // 没了就撤
        if (creep.store.getUsedCapacity() <= 0) return true
        let busy = false
        // 顺道修路 (继续保持移动)
        const road = creep.pos.findInRange(FIND_STRUCTURES, 3).find(
            obj => obj.structureType == STRUCTURE_ROAD && obj.hits < obj.hitsMax
        ) as StructureRoad | undefined
        if (!busy && road) {
            creep.repair(road)
            busy = true
        }
        // 看到工地建一下 (继续保持移动: remoteCarrier work 很少，所以停下来建造非常影响搬运效率)
        const sites = creep.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3)
        if (!busy && sites.length > 0) {
            creep.build(_.min(sites, obj => obj.progressTotal - obj.progress))
            busy = true
        }
        // 移动/传输
        const to = data.toID && Game.getObjectById(data.toID)
        if (to) {
            const res = creep.transfer(to, RESOURCE_ENERGY)
            if (res == ERR_NOT_IN_RANGE)
                creep.moveTo(to)
            else if (res == OK) { // 预测下一步返回
                const containerFlag = Game.flags[data.containerFlagName]
                creep.moveTo(containerFlag)
            }
            else
                logError("cannot send energy", creep.name)
        }
        return false
    },
    hangSpawn: (spawnRoom, rawData) => {
        const data = rawData as RemoteCarrierData
        const containerFlag = Game.flags[data.containerFlagName]
        if (!containerFlag) return true // 没有旗帜 (?)
        const targetRoom = Game.rooms[containerFlag.pos.roomName]
        if (!targetRoom) return true // 没有视野
        if (targetRoom.enemyOrInvaderCreeps().length > 0) return true // 房间里有危险
        return false
    }
}
