import { creepApi } from "creepApi";
import { ToN, logConsole, logError, myMin } from "utils/other";

// 专注于捡 sourceFlag (即外矿开采位) 的资源
// 只搬到出生房间的 storage (可以在路上 link 捡走)
// 顺便负责修路

declare global {
    interface RemoteCarrierData extends EmptyData {
        containerFlagName: string
        toID?: Id<StructureStorage | StructureLink>
        // TODO: 统计信息并自适应地更新 body
        spawnRoomEnergyCap?: number
        fullCount?: number
        freeCount?: number
    }
}

export const remoteCarrierLogic: CreepLogic = {
    prepare_stage: creep => {
        const data = creep.memory.data as RemoteCarrierData
        if (data.spawnRoomEnergyCap === undefined) data.spawnRoomEnergyCap = creep.room.energyCapacityAvailable
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
        if (creep.store.getFreeCapacity() <= 0) {
            data.fullCount = data.fullCount ? data.fullCount + 1 : 1
            return true
        }
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
        if (!container || container.store[RESOURCE_ENERGY] <= 100) {
            // container 空了，跑路，避免堵塞 (carry 空的时候不能直接转 stage ，否则会来回切换 stage)
            if (creep.store.getUsedCapacity() > 0) {
                data.freeCount = data.freeCount ? data.freeCount + 1 : 1
                return true
            }
            const to = data.toID && Game.getObjectById(data.toID)
            to && creep.moveTo(to)
        }
        else {
            const res = creep.withdraw(container, RESOURCE_ENERGY)
            if (res == OK) {
                const to = data.toID && Game.getObjectById(data.toID)
                to && creep.moveTo(to)
            }
            else
                logError("cannot get energy", creep.name)
        }
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
        const site = myMin(creep.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3), obj => obj.progressTotal - obj.progress)
        if (!busy && site) {
            creep.build(site)
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
            else if (res == ERR_FULL && (to instanceof StructureLink)) { // link 堵了，原地等待 link 恢复
            }
            else
                logError("cannot send energy", creep.name)
        }
        return false
    },
    death_stage: (memory) => {
        const data = memory.data as RemoteCarrierData
        logConsole(`test: ${memory.configName}, FULL ${data.fullCount}, FREE ${data.freeCount}`)
        if (data.fullCount && data.fullCount > ToN(data.freeCount) * 3 && data.fullCount > 5) {
            const exBodyConf = creepApi.getExtraBody(memory.configName)
            if (exBodyConf && ToN(exBodyConf.move) < 5) {
                logConsole(`${memory.configName} add exBodyConf`)
                exBodyConf.move = ToN(exBodyConf.move) + 1
                exBodyConf.carry = ToN(exBodyConf.carry) + 2
            }
        }
    },
    hangSpawn: (spawnRoom, memData) => {
        const data = memData as RemoteCarrierData
        const containerFlag = Game.flags[data.containerFlagName]
        if (!containerFlag) return true // 没有旗帜 (?)
        const targetRoom = Game.rooms[containerFlag.pos.roomName]
        if (!targetRoom) return true // 没有视野
        if (targetRoom.enemyOrInvaderCreeps().length > 0 || targetRoom.invaderCore()) return true // 房间里有危险
        return false
    }
}
