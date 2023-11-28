import { ToN, anyStore, logConsole, logError, mySingleToList } from "utils/other"

type toType = StructureSpawn | StructureExtension | StructureTower |
    StructureTerminal | StructureContainer | StructurePowerSpawn | StructureFactory
declare global {
    interface FillerData extends EmptyData {
        toID?: Id<toType>
        resourceType?: ResourceConstant
    }
}

const funcList: ((room: Room) => [ResourceConstant | undefined, toType[]])[] = [
    room => [RESOURCE_ENERGY, room.mySpawns().filter(obj => obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0)],
    room => [RESOURCE_ENERGY, room.upgradeContainers().filter(obj => obj.store.getFreeCapacity(RESOURCE_ENERGY) > 500)],
    room => [RESOURCE_ENERGY, room.myFreeExtensionsRough()],
    room => [RESOURCE_ENERGY, room.myTowers().filter(obj => obj.store.getFreeCapacity(RESOURCE_ENERGY) > 100)],
    room => [RESOURCE_ENERGY, mySingleToList(room.myPowerSpawn()).filter(obj => obj.store[RESOURCE_ENERGY] < 1000)],
    room => [RESOURCE_ENERGY, mySingleToList(room.terminal).filter(obj => obj.lowEnergy())],
    room => [room.terminal?.resourceNeed(), mySingleToList(room.terminal)],
    room => [RESOURCE_POWER, mySingleToList(room.myPowerSpawn()).filter(
        obj => obj.store[RESOURCE_POWER] <= 10 && room.storage && room.storage.store[RESOURCE_POWER] > 0)],
    room => [RESOURCE_ENERGY, mySingleToList(room.myFactory()).filter(obj => obj.lowEnergy())],
    room => [room.myFactory()?.resourceNeed(), mySingleToList(room.myFactory())],
]

function calcTask (creep: Creep, pos: RoomPosition, next?: boolean) {
    // const cpuBegin = Game.cpu.getUsed()
    const data = creep.memory.data as FillerData
    const banID = next ? data.toID : undefined
    let to = data.toID && data.toID != banID && Game.getObjectById(data.toID)
    var type: ResourceConstant | undefined = data.resourceType
    // 这个 store.getCapacity() 接口太傻逼了
    if (
        !(to && type) || to.store[type] >= ToN(to.store.getCapacity(type))
    ) {
        to = undefined
        funcList.forEach(f => {
            if (!to) {
                // const test = Game.cpu.getUsed()
                const tuple = f(creep.room)
                to = tuple[0] && creep.pos.findClosestByRange(tuple[1].filter(obj => obj.id != banID))
                type = tuple[0]
                // if (creep.room.name == 'E26S27')
                // logConsole(`cpu cost: ${Game.cpu.getUsed() - test}`)
            }
        })
    }
    // if (creep.room.name == 'E26S27')
    // logConsole(`filler calcTask cpu cost: ${Game.cpu.getUsed() - cpuBegin} at ${creep.room.name}`)
    if (to && type) {
        data.toID = to.id
        data.resourceType = type
        return {
            to: to,
            type: type,
        }
    }
    data.toID = undefined
    data.resourceType = undefined
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
        if (!t) {
            creep.sleep(10)
            return false
        }
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
        if (!t) {
            creep.sleep(10)
            return true
        }
        // 资源不对，转 source 但不清除缓存
        if (creep.store[t.type] <= 0) return true
        const res = creep.transfer(t.to, t.type)
        if (res == ERR_NOT_IN_RANGE)
            creep.goTo(t.to)
        else if (res == OK) {
            // 提前移动
            if (creep.store[t.type] > ToN(t.to.store.getFreeCapacity(t.type))) {
                const nextT = calcTask(creep, creep.pos, true)
                nextT && creep.goTo(nextT.to)
            }
            else {
                creep.room.storage && creep.goTo(creep.room.storage)
            }
        }
        else
            logError("cannot send resource", creep.name)
        return false
    },
}
