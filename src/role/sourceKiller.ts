import { isInvader, logError, noInvader } from "utils/other"

interface SourceKillerMemory {
    targetID?: Id<Creep>
    targetFlagName: string
    extraFlagName?: string
}

function stage(creep: Creep, flag: Flag): boolean {
    const mem = creep.memory as SourceKillerMemory
    const danger = creep.hits < creep.hitsMax - 300
    const safe = creep.hits >= creep.hitsMax - 100
    const enemy_range = 6
    // 寻敌
    if (!mem.targetID || !Game.getObjectById(mem.targetID) || Game.time % 10 == 0) {
        const enemys = creep.pos.findInRange(FIND_HOSTILE_CREEPS, enemy_range)
        if (enemys.length > 0) {
            const close_enemy = creep.pos.findClosestByPath(enemys)
            const healer = enemys.find(e => e.body.find(b => b.type == HEAL))
            if (close_enemy && creep.pos.inRangeTo(close_enemy, 3))
                mem.targetID = close_enemy.id
            else if (healer)
                mem.targetID = healer.id
            else {
                mem.targetID = close_enemy ? close_enemy.id : undefined
            }
        } else {
            mem.targetID = undefined
        }
    }
    const enemy = mem.targetID && Game.getObjectById<Creep>(mem.targetID)
    // 没有敌人 (和平或未到战场)
    if (!enemy) {
        const hurts = creep.pos.findInRange(FIND_MY_CREEPS, enemy_range, {
            filter: obj => obj.hits < obj.hitsMax
        })
        if (hurts.length > 0) {
            const hurt = creep.pos.findClosestByPath(hurts)
            if (hurt) creep.rangedHeal(hurt)
            if (hurt && creep.heal(hurt) == ERR_NOT_IN_RANGE) {
                creep.moveTo(hurt)
                return false
            }
        }
        if (!creep.pos.inRangeTo(flag, 0))
            creep.moveTo(flag)
        return false
    }
    // 战场中
    // 治疗
    let moveToHeal: boolean = false
    let noHeal: boolean = false
    if (danger)
        creep.heal(creep)
    else {
        // 治疗周围 (包括自己) 受伤最高友军
        const friends = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
            filter: obj => obj.memory.role == creep.memory.role && obj.hits < obj.hitsMax
        })
        if (friends.length > 0)
            creep.heal(_.max(friends, obj => obj.hitsMax - obj.hits))
        // 移动到受伤友军
        else {
            const dis = safe ? 5 : 3
            // 受点小伤没必要跑过去，可能影响进攻
            const far_friends = creep.pos.findInRange(FIND_MY_CREEPS, dis, {
                filter: obj => obj.memory.role == creep.memory.role && obj.hits < obj.hitsMax - 100
            })
            if (far_friends.length > 0) {
                creep.moveTo(far_friends[0])
                moveToHeal = true
            }
            noHeal = true
        }
    }
    // 进攻
    const attackRes = creep.rangedAttack(enemy)
    if (!moveToHeal) {
        // 保持距离
        if (creep.pos.inRangeTo(enemy, 2) || (danger && creep.pos.inRangeTo(enemy, 3)))
            creep.moveAway(enemy.pos)
        // 主动出击
        else if (safe && attackRes == ERR_NOT_IN_RANGE)
            creep.moveTo(enemy)
    }
    return false
}

export const sourceKillerLogic: CreepLogic = {
    prepare_stage: creep => {
        const mem = creep.memory as SourceKillerMemory
        return creep.goToRoomByFlag(mem.targetFlagName)
    },
    // target: 团队配合走位击杀 source keeper / invader
    target_stage: creep => {
        const mem = creep.memory as SourceKillerMemory
        const targetFlag = Game.flags[mem.targetFlagName]
        let flag: Flag = targetFlag
        if (mem.extraFlagName) {
            const extraFlag = Game.flags[mem.extraFlagName]
            // 判断哪边更紧急
            if (targetFlag.memory.lairTick && extraFlag.memory.lairTick && extraFlag.memory.lairTick < targetFlag.memory.lairTick)
                flag = extraFlag
        }
        return stage(creep, flag)
    },
    needSpawn: task => {
        const flagName = task.memory.targetFlagName
        if (!flagName) return false
        if (noInvader(flagName)) return true
        const room = Game.flags[flagName].room
        if (!room) return false // 目标房间被杀光了，去了大概率打不过
        const invaders = room.find(FIND_HOSTILE_CREEPS, { filter: isInvader })
        const totalBodyCount = _.sum(invaders, obj => obj.body.length)
        if (totalBodyCount > 25) return false // 大型 invader 小队，打不过
        return true
    },
}

export function initSourceKillerMemory(targetFlagName: string, extraFlagName?: string): CreepMemory {
    return {
        role: 'sourceKiller',
        taskName: 'auto',
        targetFlagName: targetFlagName,
        extraFlagName: extraFlagName,
    }
}
