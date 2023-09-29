// 走到目标房间摸鱼

declare global {
    interface ViewerData extends EmptyData {
        targetRoomName: string
    }
}

export const viewerLogic: CreepLogic = {
    prepare_stage: creep => {
        const data = creep.memory.data as ViewerData
        if (!creep.goToRoom(data.targetRoomName)) return false
        return true
    },
    source_stage: creep => {
        const data = creep.memory.data as ViewerData
        creep.moveTo(new RoomPosition(25, 25, data.targetRoomName))
        return false
    },
    hangSpawn: (spawnRoom, rawData) => {
        const data = rawData as ViewerData
        const targetRoom = Game.rooms[data.targetRoomName]
        if (targetRoom) return true // 已经有视野
        const mem = Memory.rooms[data.targetRoomName]
        if (mem && mem.invaderTime && mem.invaderTime + 1500 > Game.time) return true // 房间记录 invaderTime 没到时候
        return false
    }
}
