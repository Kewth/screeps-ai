import { SimpleRole } from "./SimpleRole";

export class Harvester extends SimpleRole {
    public static get_name(): RoleString {
        return "harvester";
    }
    public static get_body(): BodyPartConstant[] {
        // TODO: container 位置好就不需要 CARRY
        return [WORK, WORK, WORK, CARRY, MOVE]; // 400
    }
    public static find_target_id(creep: Creep): string | null {
        // 填满 container
        const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (obj: AnyStructure) =>
                obj.structureType == STRUCTURE_CONTAINER &&
                obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (container)
            return container.id;
        else
            return null;
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
        return num < 2;
    }

    public static get_can_sleep(): boolean {
        // 完成任务了也要站在原地，不要离开工位
        return false;
    }
    public static work_source(creep: Creep): boolean {
        // 特判让位逻辑
        // if (creep.pos.roomName == global.mainRoomName && creep.pos.x == 17 && creep.pos.y == 19) {
        //     // 尝试往左走让位置
        //     creep.move(LEFT);
        //     // 不能 return ! 如果左边有人了还要继续挖矿！
        // }
        // 只挖 source
        const source = creep.pos.findClosestByPath(FIND_SOURCES);
        if (source) {
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0;
        } else
            return false;
    }
}
