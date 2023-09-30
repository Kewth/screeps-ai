import { mountCreep } from "./creep";
import { mountFlag } from "./flag";
import { mountGlobal } from "./global";
import { mountRoom } from "./room";

export function mountAll() {
    mountCreep()
    mountRoom()
    mountFlag()
    mountGlobal()
}
