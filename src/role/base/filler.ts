// 将 erengy 填充到需要的位置
// TODO: 将 storage 前后的 filler 拆分

import { Setting } from "setting"
import { ToN, anyStore, logConsole, logError } from "utils/other"

declare global {
    interface FillerData extends EmptyData {
        toID?: Id<StructureSpawn | StructureExtension | StructureTower | StructureTerminal | StructureContainer | StructurePowerSpawn>
        resourceType?: ResourceConstant
    }
}

function calcTask (creep: Creep, pos: RoomPosition, next?: boolean) {
    const data = creep.memory.data as FillerData
    const banID = next ? data.toID : undefined
    let to = data.toID && data.toID != banID && Game.getObjectById(data.toID)
    var type: ResourceConstant | undefined = data.resourceType
    // 这个 store.getCapacity() 接口太傻逼了
    if (!to || !data.resourceType || to.store[data.resourceType] >= ToN(to.store.getCapacity(data.resourceType))) {
        to = undefined
        // 有孵化任务优先填充
        if (creep.room.getActiveSpawnConfigName() !== undefined) {
            to =
                pos.findClosestByPath(creep.room.myExtensions(), {
                    filter: obj => obj.id != banID && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                }) ||
                pos.findClosestByPath(creep.room.mySpawns(), {
                    filter: obj => obj.id != banID && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                })
        }
        // 正常顺序 放 energy
        if (!to) {
            to =
                pos.findClosestByPath(creep.room.upgradeContainers(), {
                    filter: obj => obj.id != banID && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 500
                }) ||
                pos.findClosestByPath(creep.room.mySpawns(), {
                    filter: obj => obj.id != banID && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                }) ||
                pos.findClosestByPath(creep.room.myExtensions(), {
                    filter: obj => obj.id != banID && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                }) ||
                pos.findClosestByPath(creep.room.myTowers(), {
                    filter: obj => obj.id != banID && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 100
                }) ||
                [creep.room.myPowerSpawn()].find(obj => obj && obj.id != banID && obj.store[RESOURCE_ENERGY] < 500)
                ||
                [creep.room.terminal].find(obj => obj && obj.id != banID && obj.lowEnergy())
        }
        if (to)
            type = RESOURCE_ENERGY
        // 特殊任务
        else {
            const term = creep.room.terminal
            const ps = creep.room.myPowerSpawn()
            if (!to && term && banID != term.id && term.resourceNeed()) {
                to = term
                type = term.resourceNeed()
            }
            if (!to && ps && banID != ps.id && ps.store[RESOURCE_POWER] <= 10) {
                to = ps
                type = RESOURCE_POWER
            }
            if (!to) {
                const roomTask = creep.room.getResourceTask()
                if (roomTask) {
                    to = Game.getObjectById(roomTask.targetID)
                    type = roomTask.resourceType
                }
            }
        }
    }
    if (to && type) {
        data.toID = to.id
        data.resourceType = type
        return {
            to: to,
            type: type,
        }
    }
    return undefined
}

export const fillerLogic: CreepLogic = {
    prepare_stage: creep => {
        // 提前孵化避免没 filler 停摆 (主要是 RCL 低的时候)
        creep.memory.readyUsedTime = ToN(creep.memory.readyUsedTime) + 50
        return true
    },
    source_stage: creep => {
        const t = calcTask(creep, creep.room.storage?.pos || creep.pos)
        if (!t) return false
        if (creep.store[t.type] >= creep.store.getCapacity()) return true
        // 多余不对的资源放进 storage
        if (creep.store[t.type] < creep.store.getUsedCapacity()) {
            const type = anyStore(creep)
            if (type && creep.room.storage) {
                const res = creep.transfer(creep.room.storage, type)
                if (res == ERR_NOT_IN_RANGE)
                    creep.goTo(creep.room.storage)
            }
            // 要是没 storage 就只能扔掉了
            else if (type)
                creep.drop(type)
            return false
        }
        // 不是能量的话拿了就行 (因为可能拿不满)
        if (t.type != RESOURCE_ENERGY && creep.store[t.type] > 0) return true
        // 拿资源
        const from = t.type == RESOURCE_ENERGY ? creep.findEnergySource() : creep.room.storage
        if (from) {
            const res = creep.gainResourceFrom(from, t.type)
            if (res == ERR_NOT_IN_RANGE)
                creep.goTo(from)
            else if (res == OK) {
                // 提前移动
                creep.goTo(t.to)
            }
            else {
                const data = creep.memory.data as FillerData
                delete data.toID
                delete data.resourceType
                logError(`cannot get resource: ${res}`, creep.name)
            }
        } else
            creep.say('寄了！没地方拿资源了！')
        return false
    },
    target_stage: creep => {
        // 完全空了，转 source 并刷新缓存
        if (creep.store.getUsedCapacity() <= 0) {
            const data = creep.memory.data as FillerData
            delete data.toID
            delete data.resourceType
            return true
        }
        const t = calcTask(creep, creep.pos)
        if (t) {
            // 资源不对，转 source 但不清除缓存
            if (creep.store[t.type] <= 0) return true
            const res = creep.transfer(t.to, t.type)
            if (res == ERR_NOT_IN_RANGE)
                creep.goTo(t.to)
            else if (res == OK) {
                // 提前移动
                if (t.type == RESOURCE_ENERGY && creep.store[t.type] > ToN(t.to.store.getFreeCapacity(t.type))) {
                    const nextT = calcTask(creep, creep.pos, true)
                    nextT && creep.goTo(nextT.to)
                }
                else {
                    creep.room.storage && creep.goTo(creep.room.storage)
                }
            }
            else
                logError("cannot send resource", creep.name)
        }
        return false
    },
}
