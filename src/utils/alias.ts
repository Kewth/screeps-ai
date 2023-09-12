export function getUnsafe(id: string | undefined): any {
    return id ? Game.getObjectById(id) : null
}
