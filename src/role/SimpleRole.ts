export class SimpleRole {
    // 必须重写的函数

    public static get_name(): RoleString {
        return "error_role";
    }
    public static get_body(): BodyPartConstant[] {
        return [WORK, CARRY, MOVE];
    }
    public static find_target_id(creep: Creep): string | null {
        return null;
    }
    public static work_target(creep: Creep, target_id: string): boolean {
        return true;
    }
    public static need_spawn(room: Room, num: number, rich: boolean): boolean {
        return false;
    }

    // 可选重写的函数

    public static get_can_sleep(): boolean {
        return true;
    }
    // public static work_recycle(creep: Creep): boolean {
        // // 如果周边有掉落能量就捡起来
        // const drops = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
            // filter: obj => obj.resourceType == RESOURCE_ENERGY
        // });
        // if (drops.length > 0) {
            // const dropEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                // filter: obj => obj.resourceType == RESOURCE_ENERGY
            // });
            // if (dropEnergy && creep.pickup(dropEnergy) == ERR_NOT_IN_RANGE) {
                // creep.moveTo(dropEnergy, { visualizePathStyle: { stroke: "#ffaa00" } });
                // return false;
            // } else
                // return creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0;
        // }
        // // TODO: 捡坟墓
    // }
    public static work_source(creep: Creep): boolean {
        if (creep.room.memory.has_container) {
            const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (obj: AnyStructure) =>
                    obj.structureType == STRUCTURE_CONTAINER &&
                    obj.store.getUsedCapacity(RESOURCE_ENERGY) > creep.store.getCapacity(RESOURCE_ENERGY)
            });
            if (container) {
                if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                // 只要拿到了能量就去工作，不必拿满
                return creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
            } else {
                // container 能量不够就原地等一会
                return false;
            }
        } else {
            // 没有 container 的阶段先挖 source (container 挂掉的紧急预案)
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (source) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                // 把自己挖满再去工作
                return creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0;
            } else
                return false;
        }
    }
    public static work(creep: Creep) {
        if (creep.memory.need_source) {
            // 如果周边有掉落能量就捡起来
            const drops = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
                filter: obj => obj.resourceType == RESOURCE_ENERGY
            });
            if (drops.length > 0) {
                const dropEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                    filter: obj => obj.resourceType == RESOURCE_ENERGY
                });
                if (dropEnergy && creep.pickup(dropEnergy) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(dropEnergy, { visualizePathStyle: { stroke: "#ffaa00" } });
                }
                if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0)
                    creep.memory.need_source = false;
            } else {
                // 否则进入获取资源的逻辑
                if (this.work_source(creep))
                    creep.memory.need_source = false;
            }
        } else {
            const target_id = this.find_target_id(creep);
            if (target_id) {
                if (this.work_target(creep, target_id))
                    creep.memory.need_source = true;
            } else if (this.get_can_sleep()) {
                // 没事做就睡觉
                const target = creep.pos.findClosestByPath(FIND_FLAGS, {
                    filter: (flag: Flag) => flag.memory.is_sleep
                });
                if (target)
                    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
            }
        }
    }

    public static work_all_creeps(room: Room) {
        const role_name = this.get_name();
        const list = _.filter(Game.creeps, (creep) =>
            creep.memory.role == role_name && creep.room == room
        );

        if (room.find(FIND_MY_SPAWNS).length > 0) {
            // 房间储存的能量十分充足
            const rich = room.memory.container_used_energy_cap >= room.memory.container_energy_cap * 0.7;

            const need = this.need_spawn(room, list.length, rich);
            console.log(`number of ${role_name} in ${room.name}: ${list.length} (${need})`);

            if (need) {
                const creep_name = role_name + '-' + Game.time;
                const spawns = room.find(FIND_MY_SPAWNS);
                if (spawns.length > 0) {
                    if (spawns[0].spawnCreep(this.get_body(), creep_name, {
                        memory: { role: role_name, need_source: true }
                    }) == OK) {
                        console.log(`Spawning new ${role_name}: ${creep_name}`);
                    }
                }
            }
        }

        for (const name in list)
            this.work(list[name]);
    }
}
