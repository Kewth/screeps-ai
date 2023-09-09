import { SimpleRole } from "./SimpleRole";

export class Stealer extends SimpleRole {
    public static get_name(): RoleString {
        return "stealer";
    }
    public static get_body(): BodyPartConstant[] {
        return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]; // 500
    }
    public static find_target_id(creep: Creep): string | null {
        if (creep.pos.roomName != global.mainRoomName) {
            // 随便找一个 container 作目标
            const targets = Game.rooms[global.mainRoomName].find(FIND_STRUCTURES, {
                filter: (obj: AnyStructure) =>
                    obj.structureType == STRUCTURE_CONTAINER &&
                    obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            if (targets.length > 0)
                return targets[0].id;
            else
                return null;
        } else {
            // 运回自己房间的 container
            const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (obj: AnyStructure) =>
                    obj.structureType == STRUCTURE_CONTAINER &&
                    obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            if (target)
                return target.id;
            else
                return null;
        }
    }
    public static work_target(creep: Creep, target_id: string): boolean {
        const target = Game.getObjectById<StructureContainer>(target_id);
        if (!target) return false;
        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
    }
    public static need_spawn(room: Room, num: number, rich: boolean): boolean {
        // FIXME: stealer 跑出去后房间里没有 stealer 于是会继续造 (其实问题不大)
        return num < 0; // 对面出 Guard 了呜呜
    }

    public static work_source(creep: Creep): boolean {
        if (creep.room.name == global.mainRoomName) {
            creep.moveTo(Game.flags.Steal);
            return false;
        } else {
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
        }
    }
}
