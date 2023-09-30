import { creepApi } from "creepApi"
import { logConsole } from "utils/other"

export function mountGlobal() {
    Object.defineProperty(global, 'test', { get: () => {
        return -1
    } })
    Object.defineProperty(global, 'rmCF', { set: (configName: string) => {
        logConsole(`return ${creepApi.remove(configName)}`)
    } })
    Object.defineProperty(global, 'showC', { set: (roomName: string) => {
        logConsole(`return ${Game.rooms[roomName].showCreeps()}`)
    } })
}
