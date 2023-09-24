import { mountCreep } from "./creep";
import { mountFlag } from "./flag";
import { mountRoom } from "./room";

export function mountAll() {
    mountCreep()
    mountRoom()
    mountFlag()
}
