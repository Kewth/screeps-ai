import { logConsole } from "utils/other"

declare global {
    interface Cache {
        rooms: { [name: string]: RoomCache }
    }
    interface RoomCache {
        invaderCoreID?: Id<StructureInvaderCore>
        mineralID?: Id<Mineral>
        myExtensionIDs?: Id<StructureExtension>[]
        myExtensionIDsUntil?: number
        myFreeExtensionIDs?: Id<StructureExtension>[]
        myFreeExtensionIDsUntil?: number
        factoryID?: Id<StructureFactory>
    }
}

export function checkCache() {
    if (!global.cache || Game.time % 2333 <= 0) {
        logConsole('Init/Clear Cache')
        global.cache = {
            rooms: {}
        }
    }
}
