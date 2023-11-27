import { logConsole } from "utils/other"

declare global {
    interface Cache {
        rooms: { [name: string]: RoomCache }
    }
    interface RoomCache {
        invaderCoreID?: Id<StructureInvaderCore>
        mineralID?: Id<Mineral>
        myExtensionIDs?: Id<StructureExtension>[]
        myFreeExtensionIDs?: Id<StructureExtension>[]
        myFreeExtensionIDsUntil?: number
        factoryID?: Id<StructureFactory>
    }
}

export function checkCache() {
    if (!global.cache) {
        logConsole('Init/Clear Cache')
        global.cache = {
            rooms: {}
        }
    }
}
