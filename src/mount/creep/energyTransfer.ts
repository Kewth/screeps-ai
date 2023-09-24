/*
export function calcEnergySource(creep: Creep, with_priority: boolean): Id<energySourceType> | undefined {
    if (with_priority) {
        const obj = _.first(creep.room.getEnergySourceList().filter(
            obj => creep.room.memory.energySourceLocks[obj.id] > 0
        ))
        return obj ? obj.id : undefined
    }
    else {
        const obj = creep.pos.findClosestByPath(creep.room.getEnergySourceList(), {
            filter: obj => creep.room.memory.energySourceLocks[obj.id] > 0
        })
        return obj ? obj.id : undefined
    }
}
*/
