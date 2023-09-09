export class SimpleRole {
    public static get_limit(): number {
        return 0;
    }
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
    public static need_spawn(): boolean {
        return true;
    }

    public static get_can_sleep(): boolean {
        return true;
    }
    public static work_source(creep: Creep): boolean {
        // 先找 container
        const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (obj: AnyStructure) =>
                obj.structureType == STRUCTURE_CONTAINER &&
                obj.store.getUsedCapacity(RESOURCE_ENERGY) > creep.store.getCapacity(RESOURCE_ENERGY)
        });
        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            // 没有 container 就挖 source
            const source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (source) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else
                return false;
        }
        return creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0;
    }
    public static work(creep: Creep) {
        if (creep.memory.need_source) {
            if (this.work_source(creep))
                creep.memory.need_source = false;
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
                    creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
            }
        }
    }

    public static work_all_creeps() {
        const role_name = this.get_name();
        const limit = this.get_limit();
        const list = _.filter(Game.creeps, (creep) => {
            return creep.memory.role == role_name;
        });
        console.log(`number of ${role_name}: ${list.length}/${limit}`);

        const mainSpawn = Game.spawns['Spawn1'];

        if (list.length < limit) {
            const creep_name = role_name + '-' + Game.time;
            if (!mainSpawn.spawning) {
                if (mainSpawn.spawnCreep(this.get_body(), creep_name, {
                    memory: { role: role_name, need_source: true }
                }) == OK) {
                    console.log(`Spawning new ${role_name}: ${creep_name}`);
                }
            }
        }

        for (const name in list)
            this.work(list[name]);
    }
}
