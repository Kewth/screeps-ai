export function mountLink() {
    Room.prototype.work_link = function() {
        const centralLink = this.centralLink()
        if (!centralLink) return
        // 非中央 link
        const free_count = 200 // 自由调节的值
        let centralBusy: boolean = (centralLink.store[RESOURCE_ENERGY] > free_count)
        this.myLinks().forEach(link => {
            if (link.id == centralLink.id) return
            if (!centralBusy && link.store.getUsedCapacity(RESOURCE_ENERGY) > free_count) {
                centralBusy = (link.transferEnergy(centralLink) == OK)
            }
        })
    }
}
