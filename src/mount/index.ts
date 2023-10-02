import { logConsole } from "utils/other";
import { mountCreep } from "./creep";
import { mountFlag } from "./flag";
import { mountGlobal } from "./global";
import { mountRoom } from "./room";

export function mountAll() {
    logConsole('mount ALL modules')
    mountCreep()
    mountRoom()
    mountFlag()
    mountGlobal()
}
