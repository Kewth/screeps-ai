declare global {
    interface Cache {
        rooms: { [name: string]: RoomCache }
    }
    interface RoomCache {
        invaderCoreID?: Id<StructureInvaderCore>
    }
}

export function checkCache() {
    if (!global.cache) global.cache = {
        rooms: {}
    }
}
