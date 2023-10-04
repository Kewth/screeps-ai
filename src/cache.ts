interface Cache {
}
var Cache: Cache

export function checkCache() {
    if (!Cache) Cache = {}
}
