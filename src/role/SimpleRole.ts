import { modeMap } from "mode/modeMap";

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
    public static update_mode(creep: Creep): void {
    }
    public static next_mode(mode: ModeString): ModeString {
        return "sleep";
    }
    public static work() {
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
                    memory: { role: role_name, mode: "sleep" }
                }) == OK) {
                    console.log(`Spawning new ${role_name}: ${creep_name}`);
                }
            }
        }

        for (const name in list) {
            const creep = list[name];
            this.update_mode(creep);
            if (modeMap(creep.memory.mode).run(creep)) {
                creep.memory.mode = this.next_mode(creep.memory.mode);
            }
        }
    }
}
