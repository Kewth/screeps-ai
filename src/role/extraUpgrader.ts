import { upgraderLogic } from "./upgrader"

export const extraUpgraderLogic: CreepLogic = {
    prepare_stage: upgraderLogic.prepare_stage,
    source_stage: upgraderLogic.source_stage,
    target_stage: upgraderLogic.target_stage,
    needSpawn: task => {
        const room = Game.rooms[task.roomName]
        return Boolean(room && room.storage && room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 50000)
    }
}

export function initExtraUpgraderMemory(): CreepMemory {
    return {
        role: 'extraUpgrader',
        taskName: 'auto',
    }
}
