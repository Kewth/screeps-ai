import { isEnemyOrInvader, isEvil, myMin } from "utils/other"

export function mountTower() {
    Room.prototype.work_tower = function() {
        const towers = this.myTowers()
        // 集中攻击
        const enemys = this.find(FIND_HOSTILE_CREEPS, { filter: isEvil })
        if (enemys.length > 0) {
            const enemy = myMin(enemys, e => e.hits)
            enemy && towers.forEach(tower => tower.attack(enemy))
            return
        }
        // 维修
        let busy_tower_list: Id<StructureTower>[] = []
        // 维护刚建出来的 rampart
        this.myRamparts().filter(obj => obj.hits < 800).forEach(rampart => {
            const free_tower = towers.find(t => !busy_tower_list.includes(t.id))
            if (free_tower) {
                busy_tower_list.push(free_tower.id)
                free_tower.repair(rampart)
            }
        })
        // 修复 tower 附近的建筑
        const brokens = [...this.roads(), ...this.allContainers()].filter(obj => obj.hits < obj.hitsMax - 800)
        brokens.forEach(broken => {
            const free_towers = broken.pos.findInRange(towers, 5, {
                filter: (t: StructureTower) => !busy_tower_list.includes(t.id)
            })
            if (free_towers.length > 0) {
                const free_tower = free_towers[0]
                busy_tower_list.push(free_tower.id)
                free_tower.repair(broken)
            }
        })
        // 治疗 creep / powerCreep
        const hurts = [...this.myCreeps(), ...this.find(FIND_MY_POWER_CREEPS)].filter(obj => obj.hits < obj.hitsMax)
        hurts.forEach(creep => {
            const free_towers = towers.filter(t => !busy_tower_list.includes(t.id))
            const free_tower = myMin(free_towers, obj => creep.pos.getRangeTo(obj))
            if (free_tower) {
                busy_tower_list.push(free_tower.id)
                free_tower.heal(creep)
            }
        })
    }
}
