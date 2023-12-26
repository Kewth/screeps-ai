import {  anyStore, logError } from "utils/other"

declare global {
    interface HarvesterData extends EmptyData {
        sourceID: Id<Source | Mineral>
        containerIDs?: Id<StructureContainer>[]
        linkIDs?: Id<StructureLink>[]
        workPosX?: number
        workPosY?: number
    }
}

export const harvesterLogic: CreepLogic = {
    // prepare: 移动到 source 周边，优先站在 container 上
    prepare_stage: creep => {
        creep.memory.allowCross = false
        const data = creep.memory.data as HarvesterData
        const source = Game.getObjectById(data.sourceID)
        if (!source) { logError('no source', creep.name); return false }
        // 计算工位
        if (data.workPosX === undefined || data.workPosY === undefined) {
            const sourceContainers = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: obj => obj.structureType == STRUCTURE_CONTAINER
            }) as StructureContainer[]
            // NOTE: 不能直接存储 RoomPosition (或者说存在 Memory 里的 RoomPosition 不能拿来用)
            const workPos = sourceContainers.length > 0 ? sourceContainers[0].pos : source.pos
            data.workPosX = workPos.x
            data.workPosY = workPos.y
        }
        // 移动到工位
        const range = data.workPosX == source.pos.x && data.workPosY == source.pos.y ? 1 : 0
        if (!creep.pos.inRangeTo(data.workPosX, data.workPosY, range)) {
            const res = creep.moveTo(data.workPosX, data.workPosY)
            return false
        }
        // 如果有 carry 就可以 transfer/harvester
        const carryBody = creep.body.find(obj => obj.type == CARRY)
        if (carryBody) {
            data.containerIDs = (creep.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: obj => obj.structureType == STRUCTURE_CONTAINER
            }) as StructureContainer[]).map(obj => obj.id)
            data.linkIDs = (creep.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: obj => obj.structureType == STRUCTURE_LINK
            }) as StructureLink[]).map(obj => obj.id)
        }
        return true
    },
    // source: 不停开采并输送至 container (直接开采能量掉进 container)
    source_stage: creep => {
        const data = creep.memory.data as HarvesterData
        const source = Game.getObjectById(data.sourceID)
        // 有空间直接挖，先存着 (可能有多出来的掉进 container 里面)
        if (creep.store.getFreeCapacity() > 0) {
            source && creep.harvest(source)
            return false
        }
        // transfer/harvest 可以在同一 tick 完成
        // 优先放 link
        if (data.linkIDs && source instanceof Source) {
            const link = data.linkIDs.map(id => Game.getObjectById(id)).find(
                obj => obj && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            )
            if (link) {
                creep.transfer(link, RESOURCE_ENERGY)
                source && creep.harvest(source)
                return false
            }
        }
        // 其次放 container 等其他人来拿
        if (data.containerIDs && data.containerIDs.length > 0) {
            const container = data.containerIDs.map(id => Game.getObjectById(id)).find(
                obj => obj && obj.store.getFreeCapacity() > 0
            )
            if (container) {
                creep.transfer(container, anyStore(creep) || RESOURCE_ENERGY)
                source && creep.harvest(source)
                return false
            }
            // container 爆满的话没必要挖了
            creep.sleep(10)
            return false
        }
        // 初期，挖出来 drop 给别人捡
        source && creep.harvest(source)
        return false
    },
    checkSpawn: (spawnRoom, mixData) => {
        const data = mixData as HarvesterData
        const source = Game.getObjectById(data.sourceID)
        if (!source) return 'stop'
        if (source instanceof Mineral && source.mineralAmount <= 0) return 'hang'
        return 'spawn'
    },
    // hangSpawn: (spawnRoom, mixData) => {
    //     const data = mixData as HarvesterData
    //     const source = Game.getObjectById(data.sourceID)
    //     if (!source) return true
    //     if (source instanceof Mineral && source.mineralAmount <= 0) return true
    //     return false
    // }
}
