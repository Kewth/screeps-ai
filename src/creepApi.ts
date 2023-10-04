import { parseGeneralBodyConf } from "utils/bodyConfig"
import { calcConfigName, logConsole } from "utils/other"

// 尽量不要让 num > 1 以及绝对不要让保持孵化的 creeps 和可能停止孵化的 creeps 共用 config
// 计划在未来去掉 live, num 的设计

export const creepApi = {
    // 添加 creepConfig 如果已经有直接覆盖 (live 保持不变)
    add<dataType extends CreepData>(
        spawnRoomName: string, role: RoleConstant, name: string, gBodyConf: GeneralBodyConfig,
        data: dataType, num: number, priority?: number, updateLock?: boolean):
        OK | ERR_NOT_OWNER | ERR_BUSY
    {
        const room = Game.rooms[spawnRoomName]
        if (!room) return ERR_NOT_OWNER
        const configName = calcConfigName(spawnRoomName, name)
        const update = Memory.creepConfigs[configName] ? true : false
        if (update && Memory.creepConfigs[configName].data.onlyOnce) {
            logConsole(`cannot update CreepConfig which is ONLYONCE: ${configName}`)
            return ERR_BUSY
        }
        if (update && data.onlyOnce) {
            logConsole(`cannot set CreepConfig to ONLYONCE: ${configName}`)
            return ERR_BUSY
        }
        if (update && !updateLock && Memory.creepConfigs[configName].updateLock) {
            logConsole(`cannot remove UPDATELOCK of CreepConfig: ${configName}`)
            return ERR_BUSY
        }
        const live = Memory.creepConfigs[configName]?.live as number | undefined
        Memory.creepConfigs[configName] = {
            spawnRoomName: spawnRoomName,
            role: role,
            data: data,
            gBodyConf: gBodyConf,
            num: num,
            live: live ? live : 0,
            priority: priority ? priority : this.DEFAULT_PRIORITY,
            updateLock: updateLock,
        }
        // 先挂起，下次 Spawn 检查的时候加进队列 (因为可能这个时候还不满足孵化要求)
        if (!live || live < num) room.addHangSpawnTask(configName)
        if (update)
            logConsole(`update CreepConfig: ${configName}`)
        else
            logConsole(`add new CreepConfig: ${configName}`)
        return OK
    },
    // 不覆盖已有配置
    tryAdd<dataType extends CreepData>(
        spawnRoomName: string, role: RoleConstant, name: string, gBodyConf: GeneralBodyConfig,
        data: dataType, num: number, priority?: number):
        ERR_NAME_EXISTS | OK | ERR_NOT_OWNER | ERR_BUSY
    {
        const configName = calcConfigName(spawnRoomName, name)
        const update = Memory.creepConfigs[configName] ? true : false
        if (update) return ERR_NAME_EXISTS
        return this.add<dataType>(spawnRoomName, role, name, gBodyConf, data, num, priority)
    },
    has(spawnRoomName: string, name: string) {
        const configName = calcConfigName(spawnRoomName, name)
        return Memory.creepConfigs[configName] !== undefined
    },
    inc(configName: string): OK | ERR_NOT_FOUND {
        if (!Memory.creepConfigs[configName]) return ERR_NOT_FOUND
        Memory.creepConfigs[configName].num += 1
        logConsole(`increase CreepConfig: ${configName}`)
        return OK
    },
    dec(configName: string): OK | ERR_NOT_FOUND | ERR_INVALID_TARGET {
        if (!Memory.creepConfigs[configName]) return ERR_NOT_FOUND
        if (Memory.creepConfigs[configName].num <= 0) return ERR_INVALID_TARGET
        Memory.creepConfigs[configName].num -= 1
        logConsole(`decrease CreepConfig: ${configName}`)
        // 将在 Memory 模块里自动清理 live = 0, num = 0 的 config
        return OK
    },
    remove(configName: string): OK | ERR_NOT_FOUND | ERR_INVALID_TARGET {
        if (!Memory.creepConfigs[configName]) return ERR_NOT_FOUND
        if (Memory.creepConfigs[configName].num <= 0) return ERR_INVALID_TARGET
        Memory.creepConfigs[configName].num = 0
        logConsole(`remove CreepConfig: ${configName}`)
        // 将在 Memory 模块里自动清理 live = 0, num = 0 的 config
        return OK
    },
    getExtraBody(configName: string): BodyConfig | undefined {
        const config = Memory.creepConfigs[configName]
        if (config) {
            if (!config.extraBodyConf) config.extraBodyConf = {}
            return config.extraBodyConf
        }
        return undefined
    },

    DEFAULT_PRIORITY: 0,
    KEEPERATTACKER_PRIORITY: 1,
    VIEWER_PRIORITY: 9,
    LINKTRANSFER_PRIORITY: 9,
    FILLER_PRIORITY: 10,
    EMERGENCY_PRIORITY: 11,
}
