// 针对 Rhodan 房间的侵略

import { logConsole, myMin } from "utils/other"

declare global {
    interface RoomAttackerData extends EmptyData {
        wallFlagName: string
        towerID?: Id<StructureTower>
        spawnID?: Id<StructureSpawn>
        fighting?: boolean
        jobDone?: boolean
    }
}

function rangedAttackFree(creep: Creep): void {
    const hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3)
    creep.rangedAttack(hostiles[0])
    // if (creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3).length > 0)
    //     creep.rangedMassAttack()
    // if (creep.pos.findInRange(FIND_HOSTILE_STRUCTURES, 3).length > 0)
    //     creep.rangedMassAttack()
}

export const roomAttakerLogic: CreepLogic = {
    prepare_stage: creep => {
        const data = creep.memory.data as RoomAttackerData
        const wallFlag = Game.flags[data.wallFlagName]
        if (creep.goToRoom(wallFlag.pos.roomName)) {
            const tower = creep.room.find(FIND_HOSTILE_STRUCTURES).find(
                obj => obj.structureType == STRUCTURE_TOWER
            ) as StructureTower | undefined
            const spawn = creep.room.find(FIND_HOSTILE_SPAWNS).find(obj => true)
            data.towerID = tower?.id
            data.spawnID = spawn?.id
            return true
        }
        else return false
    },
    target_stage: creep => {
        const data = creep.memory.data as RoomAttackerData
        const friends = creep.pos.findInRange(FIND_MY_CREEPS, 3)
        const hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3)
        // 治疗
        const healTarget = myMin(friends.filter(obj => obj.hits < obj.hitsMax), obj => creep.pos.getRangeTo(obj))
        if (healTarget) {
            if (healTarget.pos.inRangeTo(creep, 1))
                creep.heal(healTarget)
            else
                creep.rangedHeal(healTarget)
        }
        // 打破城墙
        const wallFlag = Game.flags[data.wallFlagName]
        const wall = wallFlag.pos.lookFor(LOOK_STRUCTURES)[0]
        if (wall) {
            const resp = hostiles.length > 0
                ? creep.rangedAttack(hostiles[0])
                : creep.rangedAttack(wall)
            if (resp != OK) rangedAttackFree(creep)
            if (!creep.pos.inRangeTo(wall, 2)) creep.moveTo(wall)
            return false
        }
        // 攻击防御塔
        const tower = data.towerID && Game.getObjectById(data.towerID)
        if (tower) {
            const resp = creep.rangedAttack(tower)
            if (resp != OK) rangedAttackFree(creep)
            if (!data.fighting) {
                // 有一定规模了再上
                const fightingFriends = creep.room.find(FIND_MY_CREEPS).filter(
                    obj => (obj.memory.data as RoomAttackerData).fighting === true
                )
                if (friends.length >= 3 || fightingFriends.length >= 3)
                    data.fighting = true
            }
            if (data.fighting) {
                // 冲就完了
                creep.moveTo(tower)
            }
            return false
        }
        // 攻击孵化器
        const spawn = data.spawnID && Game.getObjectById(data.spawnID)
        if (spawn) {
            const resp = creep.rangedAttack(spawn)
            if (resp != OK) rangedAttackFree(creep)
            creep.moveTo(spawn)
            return false
        }
        // 摸鱼
        rangedAttackFree(creep)
        creep.say('Win!', true)
        data.jobDone = true
        return false
    },
    stopSpawn: (spawnRoom, memData) => {
        const data = memData as RoomAttackerData
        return data.jobDone ? true : false
    },
}
