import { creepApi } from "creepApi"
import { logConsole } from "utils/other"

// 控制台操作对象
const T = {
    rmConf(configName: string) {
        return creepApi.remove(configName)
    },
    markClaim(roomName: string) {
        if (!Memory.rooms[roomName])
            Memory.rooms[roomName] = {} as RoomMemory // 强行赋值，在下一个 tick 格式化
        Memory.rooms[roomName].needClaim = true
        return OK
    },
    mountRoom() {
        for (const roomName in Memory.rooms) {
            Object.defineProperty(global, roomName, {
                get: () => Game.rooms[roomName]
            })
        }
        return OK
    },
}

export function mountGlobal() {
    Object.defineProperty(global, 'T', {
        get: () => T
    })
    T.mountRoom()
}
