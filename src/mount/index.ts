import { logConsole } from "utils/other";
import CreepExtension from "./creep";
import { mountFlag } from "./flag";
import { mountGlobal } from "./global";
import RoomExtension, { mountRoom } from "./room";
import { mountTerminal } from "./terminal";
import { mountPowerSpawn } from "./powerSpawn";
import { mountPowerCreep } from "./powerCreep";
import { mountFactory } from "./factory";
import { mountStorage } from "./storage";
import RoomPositionExtension from "./roomPosition";
import RoomExtensionTower from "./room/tower";

/**
 * 把 obj2 的原型合并到 obj1 的原型上
 * @param obj1 要挂载到的对象
 * @param obj2 要进行挂载的对象
 */
function assignPrototype(obj1: { [key: string]: any }, obj2: { [key: string]: any }) {
    Object.getOwnPropertyNames(obj2.prototype).forEach(key => {
        obj1.prototype[key] = obj2.prototype[key]
    })
}

export function mountAll() {
    logConsole('mount ALL modules')
    Creep.prototype._move = Creep.prototype.move
    assignPrototype(Creep, CreepExtension)
    assignPrototype(Room, RoomExtension)
    assignPrototype(Room, RoomExtensionTower)
    mountRoom()
    mountFlag()
    mountGlobal()
    mountTerminal()
    mountPowerSpawn()
    mountPowerCreep()
    mountFactory()
    mountStorage()
    assignPrototype(RoomPosition, RoomPositionExtension)
}
