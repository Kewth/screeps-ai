// 拆 invaderCore ，仅限手动生成！

declare global {
    interface CoreAttackerData extends EmptyData {
        targetRoomName: string
    }
}

export const coreAttackerLogic: CreepLogic = {
    // prepare:
    prepare_stage: creep => {
        const data = creep.memory.data as CoreAttackerData
        if (!creep.goToRoom(data.targetRoomName)) return false
        return true
    },
    // target:
    target_stage: creep => {
        const core = creep.room.invaderCore()
        if (!core) { creep.say('收工'); return false }
        if (creep.attack(core) == ERR_NOT_IN_RANGE)
            creep.moveTo(core)
        return false
    },
}
