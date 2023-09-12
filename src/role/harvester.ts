import { logError } from "utils/other"

// assumption: sourceFlag 附近有 source 且脚下有 container

interface HarvesterMemory extends CreepMemory {
    sourceID: Id<Source>
    // targetID: Id<StructureContainer>
    sourceFlagName: string
}

export const harvesterLogic: creepLogic = {
    // prepare: 移动到 sourceFlag 位置
    prepare_stage: creep => {
        const mem = creep.memory as HarvesterMemory
        if (!mem.sourceFlagName) {
            logError('no sourceFlagName', creep.name)
            return false
        }
        const flag = Game.flags[mem.sourceFlagName]
        if (!creep.pos.inRangeTo(flag, 0)) {
            creep.moveTo(flag)
            return false
        }
        // 移动到位后
        const source_list = creep.pos.findInRange(FIND_SOURCES, 1)
        if (source_list.length == 0) {
            logError('no source', creep.name)
            return false
        }
        if (source_list.length > 1)
            logError('too many source', creep.name)
        mem.sourceID = source_list[0].id
        return true
    },
    // source: 不停开采并输送至 container (直接开采能量掉进 container)
    source_stage: creep => {
        const mem = creep.memory as HarvesterMemory
        const source = Game.getObjectById<Source>(mem.sourceID)
        // const target = Game.getObjectById<StructureContainer>(mem.targetID)
        // transfer/harvest 可以在同一 tick 完成
        // if (target) creep.transfer(target, RESOURCE_ENERGY)
        if (source) creep.harvest(source)
        return false
    },
}
