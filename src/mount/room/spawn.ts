import { creepApi } from "creepApi"
import { addStat_spawn } from "memory/stats"
import { getRoleLogic } from "role"
import { makeBody, parseGeneralBodyConf } from "utils/bodyConfig"
import { newCreepName } from "utils/other"

export function reSpawn(memory: CreepMemory) {
    if (memory.reSpawnAlready) return
    memory.reSpawnAlready = true
    const config = Memory.creepConfigs[memory.configName]
    if (!config) return
    config.live--
    if (config.live >= config.num) return
    const spawnRoom = Game.rooms[config.spawnRoomName]
    const logic = getRoleLogic[memory.role]
    if (logic.stopSpawn && logic.stopSpawn(spawnRoom, config.data)) {
        creepApi.dec(memory.configName)
    } else
        spawnRoom && spawnRoom.addSpawnTask(memory.configName)
}

// export function addSpawnTaskByConfigName(configName: string) {
//     const config = Memory.creepConfigs[configName]
//     const room = config && Game.rooms[config.spawnRoomName]
//     if (room && config.live < config.num)
//         room.addSpawnTask(configName)
// }

export function mountSpawn() {
    // 去掉 live >= num 以及排序后的第一个孵化任务 (这是不可避免的，因为原则上 num 随时允许修改)
    Room.prototype.getActiveSpawnConfigName = function() {
        if (this.memory.spawnTaskList.length <= 0) return undefined
        this.memory.spawnTaskList.sort((a, b) => Memory.creepConfigs[b].priority - Memory.creepConfigs[a].priority)
        let configName = this.memory.spawnTaskList[0]
        let config = Memory.creepConfigs[configName]
        while (!config || config.live >= config.num) {
            this.memory.spawnTaskList.shift()
            if (this.memory.spawnTaskList.length <= 0) return undefined
            configName = this.memory.spawnTaskList[0]
            config = Memory.creepConfigs[configName]
        }
        return configName
    }

    Room.prototype.work_spawn = function() {
        const configName = this.getActiveSpawnConfigName()
        const config = configName && Memory.creepConfigs[configName]
        if (!config) return
        const spawnList = this.mySpawns().filter(obj => !obj.spawning)
        if (spawnList.length <= 0) return
        const spawn = spawnList[0]
        const creepName = newCreepName(configName)
        const bodyConf = parseGeneralBodyConf(config.gBodyConf, this.energyCapacityAvailable)
        if (!bodyConf) return // 无法孵化 TODO: 扔到队列末尾
        const bodys = makeBody(bodyConf)
        if (spawn.spawnCreep(bodys, creepName, { memory: {
            role: config.role,
            data: config.data,
            configName: configName,
        } }) == OK) {
            addStat_spawn(bodys)
            config.live++
            // 不需要移除队首
        }
    }
}
