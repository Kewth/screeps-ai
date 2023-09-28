export function mountLink() {
    Room.prototype.work_link = function() {
        const links = this.find(FIND_STRUCTURES, {
                filter: obj => obj.structureType == STRUCTURE_LINK
        }) as StructureLink[]
        if (!this.memory.centeralLinkID) {
            if (!this.storage) return
            const centralLink = this.storage.pos.findClosestByPath(links)
            if (!centralLink) return
            this.memory.centeralLinkID = centralLink.id
        }
        const centralLink = Game.getObjectById<StructureLink>(this.memory.centeralLinkID)
        if (!centralLink) return
        // 非中央 link
        const free_count = 200 // 自由调节的值
        let centralBusy: boolean = (centralLink.store[RESOURCE_ENERGY] > free_count)
        links.forEach(link => {
            if (link.id == this.memory.centeralLinkID) return
            if (!centralBusy && link.store.getUsedCapacity(RESOURCE_ENERGY) > free_count) {
                centralBusy = (link.transferEnergy(centralLink) == OK)
            }
            // link 建在要道上，回来的 creep 一定会经过，直接从过路者身上扒下来
            // const creeps = link.pos.findInRange(FIND_MY_CREEPS, 1, {
            //     filter: obj => obj.memory.allowLink
            // })
            // creeps.forEach(c => c.transfer(link, RESOURCE_ENERGY))
        })
    }
}
