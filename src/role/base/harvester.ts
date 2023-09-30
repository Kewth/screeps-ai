import {  logError } from "utils/other"

declare global {
    interface HarvesterData extends EmptyData {
        sourceID: Id<Source>
        containerIDs?: Id<StructureContainer>[]
        workPosX?: number
        workPosY?: number
    }
}

export const harvesterLogic: CreepLogic = {
    // prepare: 移动到 source 周边，优先站在 container 上
    prepare_stage: creep => {
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
        if (carryBody)
            data.containerIDs = (creep.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: obj => obj.structureType == STRUCTURE_CONTAINER
            }) as StructureContainer[]).map(obj => obj.id)
        else
            data.containerIDs = []
        return true
    },
    // source: 不停开采并输送至 container (直接开采能量掉进 container)
    source_stage: creep => {
        const data = creep.memory.data as HarvesterData
        const source = Game.getObjectById<Source>(data.sourceID)
        // transfer/harvest 可以在同一 tick 完成
        if (data.containerIDs) {
            const container = data.containerIDs.map(id => Game.getObjectById(id)).find(
                obj => obj && obj.store.getFreeCapacity() > 0
            )
            if (container) creep.transfer(container, RESOURCE_ENERGY)
        }
        if (source) creep.harvest(source)
        return false
    },
}
