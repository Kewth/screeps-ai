import { logConsole } from "utils/other"

export function mountLink() {
    Room.prototype.work_link = function() {
        const centralLink = this.myCentralLink()
        // 优先送 upgradeLink 其次 centralLink
        const targetLinks = [this.myUpgradeLink(), centralLink].filter(obj => obj !== undefined) as StructureLink[]
        if (targetLinks.length <= 0) return
        const sourceLinks = this.myLinks().filter(s => _.every(targetLinks, t => t.id != s.id))
        const free_count = 200 // 自由调节的值
        let busys = targetLinks.map(obj => obj.store[RESOURCE_ENERGY] > free_count)
        // 每个 sourceLink 按优先级传给 targetLink
        sourceLinks.forEach(link => {
            if (link.cooldown > 0) return
            for (let i = 0; i < targetLinks.length; i++)
                if (!busys[i] && link.store.getFreeCapacity(RESOURCE_ENERGY) < free_count) {
                    busys[i] = (link.transferEnergy(targetLinks[i]) == OK)
                    break
                }
        })
        // 最后 centralLink 考虑传给其他 targetLink (满足判断条件的话 centralLink 不会收到其他 link 的能量)
        if (centralLink && centralLink.cooldown <= 0 && centralLink.store[RESOURCE_ENERGY] > free_count) {
            for (let i = 0; i < targetLinks.length; i++)
                if (!busys[i] && targetLinks[i].id != centralLink.id) {
                    centralLink.transferEnergy(targetLinks[i])
                    break
                }
        }
    }
}
