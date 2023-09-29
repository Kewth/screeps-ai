import { isEnemyOrInvader, isEvil } from "utils/other"

export function mountTower() {
    Room.prototype.work_tower = function() {
        const towers = this.find(FIND_MY_STRUCTURES, {
            filter: obj => obj.structureType == STRUCTURE_TOWER
        }) as StructureTower[]
        // 集中攻击
        const enemys = this.find(FIND_HOSTILE_CREEPS, { filter: isEvil })
        if (enemys.length > 0) {
            const enemy = _.min(enemys, e => e.hits)
            towers.forEach(tower => tower.attack(enemy))
            return
        }
        // 维修
        let busy_tower_list: Id<StructureTower>[] = []
        // 维护刚建出来的 rampart
        this.find(FIND_MY_STRUCTURES, {
            filter: obj =>
                obj.structureType == STRUCTURE_RAMPART && obj.hits < 800
        }).forEach(rampart => {
            const free_tower = towers.find(t => !(t.id in busy_tower_list))
            if (free_tower) {
                busy_tower_list.push(free_tower.id)
                free_tower.repair(rampart)
            }
        })
        // 修复 tower 附近的建筑
        const brokens = this.find(FIND_STRUCTURES, {
            filter: obj =>
                (obj.structureType == STRUCTURE_CONTAINER ||
                    obj.structureType == STRUCTURE_ROAD) &&
                obj.hits < obj.hitsMax - 800
        })
        brokens.forEach(broken => {
            const free_towers = broken.pos.findInRange(towers, 5, {
                filter: (t: StructureTower) => !(t.id in busy_tower_list)
            })
            if (free_towers.length > 0) {
                const free_tower = free_towers[0]
                busy_tower_list.push(free_tower.id)
                free_tower.repair(broken)
            }
        })
    }
}
