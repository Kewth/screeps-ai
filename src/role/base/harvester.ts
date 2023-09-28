import { logError } from "utils/other"

export interface HarvesterData {
    sourceID: Id<Source>
    containerIDs?: Id<StructureContainer>[]
}

export const harvesterLogic: CreepLogic = {
    // prepare: 移动到 source
    prepare_stage: creep => {
        const data = creep.memory.data as HarvesterData
        const source = Game.getObjectById(data.sourceID)
        if (!source) { logError('no source', creep.name); return false }
        if (!creep.pos.inRangeTo(source, 1)) {
            creep.moveTo(source)
            return false
        }
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
