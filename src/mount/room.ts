import { getRoleLogic } from "role"
import { maintainCreepList } from "setting"
import { calcTaskName, logConsole, newCreepName } from "utils/other"

// TODO: 集中式孵化改为分布式
export function mountRoom() {
    Room.prototype.work = function() {
        // 检查统计
        const statInterval = 3000
        if (!this.memory.statTime || Game.time >= this.memory.statTime + statInterval)
            this.stats(true)
        // 检查孵化
        const taskList = maintainCreepList.filter(
            task => {
                if (task.roomName != this.name) return false
                if (Memory.creepSpawningTaskLiveCount[calcTaskName(task)] >= task.num) return false
                const logic = getRoleLogic[task.memory.role]
                return !logic.needSpawn || logic.needSpawn(task)
            }
        )
        if (taskList.length == 0) return
        const spawnList = this.find(FIND_MY_SPAWNS, {
            filter: (obj: StructureSpawn) => !obj.spawning
        })
        if (spawnList.length == 0) return
        const task = taskList[0]
        const spawn = spawnList[0]
        let mem = task.memory
        mem.taskName = calcTaskName(task)
        if (spawn.spawnCreep(task.body, newCreepName(task.creepName), { memory: mem }) == OK) {
            if (!Memory.creepSpawningTaskLiveCount[mem.taskName])
                Memory.creepSpawningTaskLiveCount[mem.taskName] = 1
            else
                Memory.creepSpawningTaskLiveCount[mem.taskName] ++
        }
        // TODO: 一个 Tick 指定多个 Spawn
    }

    Room.prototype.stats = function(store: boolean) {
        // 统计
        const storageEnergy = this.storage ?
            this.storage.store.getUsedCapacity(RESOURCE_ENERGY) :
            0
        const RCLprogress = this.controller ?
            this.controller.progress :
            0
        // 输出
        if (this.memory.statTime) {
            const interval = Game.time - this.memory.statTime
            logConsole(
                `${this.name}-stats(${interval} ticks):` +
                ` storage/T=${(storageEnergy - this.memory.storageEnergy) / interval}` +
                ` upgrade/T=${(RCLprogress - this.memory.RCLprogress) / interval}`
            )
        }
        // 存储
        if (store) {
            this.memory.statTime = Game.time
            this.memory.storageEnergy = storageEnergy
            this.memory.RCLprogress = RCLprogress
        }
    }

    Room.prototype.work_spawnCreep = function() {
        if (this.memory.spawnTaskList.length == 0) return false
        const spawns = this.find(FIND_MY_SPAWNS, {
            filter: (obj: StructureSpawn) => !obj.spawning
        })
        // TODO
        return false
    }

    Room.prototype.addSpawnTask = function() {
        // TODO
    }
}

declare global {
    interface Room {
        work(): void
        stats(store: boolean): void
        work_spawnCreep(): boolean
        addSpawnTask(): void
    }
}
