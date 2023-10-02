import { creepApi } from "creepApi"
import { addStat_spawn } from "memory/stats"
import { getRoleLogic } from "role"
import { calcBodyCost, makeBody, parseGeneralBodyConf, unionBodyConf } from "utils/bodyConfig"
import { ToN, logConsole, logError, newCreepName } from "utils/other"

export function reSpawn(memory: CreepMemory) {
    if (memory.reSpawnAlready) return
    memory.reSpawnAlready = true
    const config = Memory.creepConfigs[memory.configName]
    if (!config) { logError("no config", memory.configName); return }
    config.live--
    if (config.live >= config.num) return // num 减小了，多出来的 creep 就不再孵化了
    if (config.live < 0) {
        logError('live < 0', memory.configName)
        config.live = 0
    }
    const spawnRoom = Game.rooms[config.spawnRoomName]
    const logic = getRoleLogic[memory.role]
    logic.death_stage && logic.death_stage(memory)
    // 要传 memory.data (creep 处理过的) 而不是 config.data (预定义的)
    if (config.data.onlyOnce || (logic.stopSpawn && logic.stopSpawn(spawnRoom, memory.data)))
        creepApi.dec(memory.configName)
    else if (logic.hangSpawn && logic.hangSpawn(spawnRoom, memory.data))
        spawnRoom && spawnRoom.addHangSpawnTask(memory.configName)
    else
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
    Room.prototype.getActiveSpawnConfigName = function () {
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

    Room.prototype.checkHangSpawnTasks = function () {
        this.memory.hangSpawnTaskList.forEach(configName => {
            const config = Memory.creepConfigs[configName]
            if (config) {
                // 结束挂起判定
                const logic = getRoleLogic[config.role]
                if (!logic.hangSpawn || !logic.hangSpawn(this, config.data)) {
                    const bodyConf = parseGeneralBodyConf(config.gBodyConf, this.energyCapacityAvailable)
                    if (bodyConf) this.memory.spawnTaskList.push(configName)
                }
            }
        })
        // 清理
        this.memory.hangSpawnTaskList = this.memory.hangSpawnTaskList.filter(
            configName => !this.memory.spawnTaskList.includes(configName)
        )
    }

    Room.prototype.work_spawn = function () {
        if (Game.time % 50 == 0) this.checkHangSpawnTasks()
        const configName = this.getActiveSpawnConfigName()
        const config = configName && Memory.creepConfigs[configName]
        if (!config) return
        const spawnList = this.mySpawns().filter(obj => !obj.spawning)
        if (spawnList.length <= 0) return
        const spawn = spawnList[0]
        const creepName = newCreepName(configName)
        const bodyConf = parseGeneralBodyConf(config.gBodyConf, this.energyCapacityAvailable)
        if (!bodyConf) {
            // 无法孵化，挂起
            this.memory.spawnTaskList.shift()
            this.addHangSpawnTask(configName)
        }
        else {
            const newBodyConf = unionBodyConf(bodyConf, config.extraBodyConf)
            let bodys = newBodyConf ? makeBody(newBodyConf) : []
            if (bodys.length <= 0 || bodys.length > 50 || calcBodyCost(bodys) > this.energyCapacityAvailable) {
                logError('extraBody cannot be applied in spawning', this.name)
                bodys = makeBody(bodyConf)
            }
            const res = spawn.spawnCreep(bodys, creepName, {
                memory: {
                    role: config.role,
                    data: config.data,
                    configName: configName,
                }
            })
            if (res == OK) {
                addStat_spawn(bodys)
                config.live++
                // 不需要移除队首
            }
        }
    }
}
