declare global {
    interface Cache {
        rooms: { [name: string]: RoomCache }
    }
    interface RoomCache {
    }
}

export function checkCache() {
    if (!global.cache) global.cache = {
        rooms: {}
    }
}
