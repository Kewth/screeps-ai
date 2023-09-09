export class RoomStat {
    public static stat(room: Room) {
        // 是否有 container
        const containers = room.find(FIND_STRUCTURES, {
            filter: (obj: AnyStructure) => obj.structureType == STRUCTURE_CONTAINER
        });
        room.memory.has_container = containers.length > 0;
        // 计算 container 包含的能量
        let container_used_energy_cap = 0;
        let container_energy_cap = 0;
        for (const container of containers)
            if (container.structureType == STRUCTURE_CONTAINER) {
                container_used_energy_cap += container.store.getUsedCapacity(RESOURCE_ENERGY);
                container_energy_cap += container.store.getCapacity(RESOURCE_ENERGY);
            }
        room.memory.container_used_energy_cap = container_used_energy_cap;
        room.memory.container_energy_cap = container_energy_cap;
        console.log(`${room.name}: ${container_used_energy_cap}/${container_energy_cap}`);
    }
}
