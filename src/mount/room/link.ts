import { logConsole } from "utils/other"

export function mountLink() {
    Room.prototype.work_link = function() {
        const targetLinks = [this.myUpgradeLink(), this.myCentralLink()].filter(obj => obj !== undefined) as StructureLink[]
        if (targetLinks.length <= 0) return
        const sourceLinks = this.myLinks().filter(s => _.every(targetLinks, t => t.id != s.id))
        const free_count = 200 // 自由调节的值
        let busys = targetLinks.map(obj => obj.store[RESOURCE_ENERGY] > free_count)
        sourceLinks.forEach(link => {
            if (link.cooldown > 0) return
            for (let i = 0; i < targetLinks.length; i++)
                if (!busys[i] && link.store.getFreeCapacity(RESOURCE_ENERGY) < free_count) {
                    busys[i] = (link.transferEnergy(targetLinks[i]) == OK)
                    break;
                }
        })
    }
}
