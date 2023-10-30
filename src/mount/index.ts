import { logConsole } from "utils/other";
import { mountCreep } from "./creep";
import { mountFlag } from "./flag";
import { mountGlobal } from "./global";
import { mountRoom } from "./room";
import { mountTerminal } from "./terminal";
import { mountPowerSpawn } from "./powerSpawn";
import { mountPowerCreep } from "./powerCreep";

export function mountAll() {
    logConsole('mount ALL modules')
    mountCreep()
    mountRoom()
    mountFlag()
    mountGlobal()
    mountTerminal()
    mountPowerSpawn()
    mountPowerCreep()
}
