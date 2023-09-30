function lairCheck(flag: Flag) {
    const lair = flag.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: obj => obj.structureType == STRUCTURE_KEEPER_LAIR
    }) as StructureKeeperLair
    if (lair) {
        const keepers = lair.pos.findInRange(FIND_HOSTILE_CREEPS, 6, {
            filter: obj => obj.owner.username == 'Source Keeper'
        })
        if (keepers.length > 0)
            flag.memory.lairTick = -1
        else
            flag.memory.lairTick = lair.ticksToSpawn
    } else
        flag.memory.lairTick = undefined
}

export function mountFlag () {
    Flag.prototype.work = function () {
        if (!this.room) return
        if (this.memory.lairCheck) lairCheck(this)
    }
}

declare global {
    interface Flag {
        work(): void
    }
}
