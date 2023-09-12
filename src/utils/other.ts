export function newCreepName(name: string): string {
    let i = 0
    while (`${name}${i}` in Game.creeps || `${name}${i}` in Memory.creeps) i++
    return `${name}${i}`
}

export function calcTaskName(task: spawnTask): string {
    return `${task.roomName}-${task.creepName}`
}

export function logError(err: any, name: any): void {
    console.log(`ERROR@${Game.time}: ${err} (by ${name})`)
}
export function logConsole(info: any): void {
    console.log(info)
}
