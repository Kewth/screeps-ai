import { calcConfigName } from "utils/other"

// 尽量不要让 num > 1 以及绝对不要让保持孵化的 creeps 和可能停止孵化的 creeps 共用 config
// 计划在未来去掉 live, num 的设计

export const creepApi = {
    // 添加 creepConfig 如果已经有直接覆盖 (live 保持不变)
    add<dataType extends CreepData>(
        spawnRoomName: string, role: RoleConstant, name: string, gBodyConf: GeneralBodyConfig,
        data: dataType, num: number, priority?: number):
        OK | ERR_NOT_OWNER
    {
        const room = Game.rooms[spawnRoomName]
        if (!room) return ERR_NOT_OWNER
        const configName = calcConfigName(spawnRoomName, name)
        const live = Memory.creepConfigs[configName]?.live as number | undefined
        Memory.creepConfigs[configName] = {
            spawnRoomName: spawnRoomName,
            role: role,
            data: data,
            gBodyConf: gBodyConf,
            num: num,
            live: live ? live : 0,
            priority: priority ? priority : this.DEFAULT_PRIORITY
        }
        // 先挂起，下次 Spawn 检查的时候加进队列 (因为可能这个时候还不满足孵化要求)
        if (!live || live < num) room.addHangSpawnTask(configName)
        return OK
    },
    inc(configName: string): OK | ERR_NOT_FOUND {
        if (!Memory.creepConfigs[configName]) return ERR_NOT_FOUND
        Memory.creepConfigs[configName].num += 1
        return OK
    },
    dec(configName: string): OK | ERR_NOT_FOUND | ERR_INVALID_TARGET {
        if (!Memory.creepConfigs[configName]) return ERR_NOT_FOUND
        if (Memory.creepConfigs[configName].num <= 0) return ERR_INVALID_TARGET
        Memory.creepConfigs[configName].num -= 1
        // 将在 Memory 模块里自动清理 live = 0, num = 0 的 config
        return OK
    },
    remove(configName: string): OK | ERR_NOT_FOUND | ERR_INVALID_TARGET {
        if (!Memory.creepConfigs[configName]) return ERR_NOT_FOUND
        if (Memory.creepConfigs[configName].num <= 0) return ERR_INVALID_TARGET
        Memory.creepConfigs[configName].num = 0
        // 将在 Memory 模块里自动清理 live = 0, num = 0 的 config
        return OK
    },

    DEFAULT_PRIORITY: 0,
    KEEPERATTACKER_PRIORITY: 1,
    VIEWER_PRIORITY: 9,
    FILLER_PRIORITY: 10,
    EMERGENCY_PRIORITY: 11,
}
