// 专杀 source keeper ，对其他敌对 creep 也有一定作用

import { logError, myMax } from "utils/other"

declare global {
    interface KeeperAttackerData extends EmptyData {
        guardFlagNames: string[]
        evilID?: Id<Creep>
    }
}

function stage(creep: Creep, flag: Flag): boolean {
    const data = creep.memory.data as KeeperAttackerData
    const danger = creep.hits < creep.hitsMax - 300
    const safe = creep.hits >= creep.hitsMax - 100
    const enemy_range = 6
    // 寻敌
    if (!data.evilID || !Game.getObjectById(data.evilID) || Game.time % 10 == 0) {
        const evils = creep.pos.findInRange(creep.room.evilCreeps(), enemy_range)
        if (evils.length > 0) {
            const closeEvil = creep.pos.findClosestByPath(evils)
            const healer = evils.find(e => e.body.find(b => b.type == HEAL))
            if (closeEvil && creep.pos.inRangeTo(closeEvil, 3))
                data.evilID = closeEvil.id
            else if (healer)
                data.evilID = healer.id
            else
                data.evilID = closeEvil?.id
        } else {
            data.evilID = undefined
        }
    }
    const evil = data.evilID && Game.getObjectById(data.evilID)
    // 没有敌人 (和平或未到战场)
    if (!evil) {
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
        const friend_toHeal = myMax(friends, obj => obj.hitsMax - obj.hits)
        if (friend_toHeal)
            creep.heal(friend_toHeal)
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
    const attackRes = creep.rangedAttack(evil)
    if (!moveToHeal) {
        // 保持距离
        if (creep.pos.inRangeTo(evil, 2) || (danger && creep.pos.inRangeTo(evil, 3)))
            creep.moveAway(evil.pos)
        // 主动出击
        else if (safe && attackRes == ERR_NOT_IN_RANGE)
            creep.moveTo(evil)
    }
    return false
}

export const keeperAttackerLogic: CreepLogic = {
    prepare_stage: creep => {
        const data = creep.memory.data as KeeperAttackerData
        const guardFlag = Game.flags[data.guardFlagNames[0]]
        if (!guardFlag) { logError('no guardFlag', creep.name); return false }
        return creep.goToRoom(guardFlag.pos.roomName)
    },
    // target: 团队配合走位击杀 source keeper
    target_stage: creep => {
        const data = creep.memory.data as KeeperAttackerData
        let targetFlag: Flag | undefined = undefined
        data.guardFlagNames.forEach(flagName => {
            const flag = Game.flags[flagName]
            if (!targetFlag) targetFlag = flag
            else if (targetFlag.memory.lairTick && flag.memory.lairTick && flag.memory.lairTick < targetFlag.memory.lairTick)
                targetFlag = flag
        })
        if (!targetFlag) return false
        return stage(creep, targetFlag)
    },
    hangSpawn: (spawnRoom, memData) => {
        const data = memData as KeeperAttackerData
        const guardFlag = Game.flags[data.guardFlagNames[0]]
        if (!guardFlag) return true // 没有旗帜 (?)
        const targetRoom = Game.rooms[guardFlag.pos.roomName]
        if (!targetRoom) return true // 没有视野
        const creeps = targetRoom.enemyOrInvaderCreeps()
        const totalBodyCount = _.sum(creeps, obj => obj.body.length)
        if (totalBodyCount > 25) return true // 大型 invader 小队，打不过
        if (targetRoom.invaderCore()) return true // invader core 打不过
        return false
    },
}
