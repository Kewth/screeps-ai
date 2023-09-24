/*
  Example types, expand on these or remove them and add your own.
  Note: Values, properties defined here do no fully *exist* by this type definiton alone.
        You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

  Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
  Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
*/

// Syntax for adding proprties to `global` (ex "global.log")
declare namespace NodeJS {
  interface Global {
    log: any
    mainRoomName: string
  }
}

interface CreepLogic {
  prepare_stage?: (creep: Creep) => boolean
  source_stage?: (creep: Creep) => boolean
  target_stage?: (creep: Creep) => boolean
  needSpawn?: (task: SpawnTask) => boolean
}

interface SpawnTask {
  roomName: string
  creepName: string
  body: BodyPartConstant[]
  memory: CreepMemory
  num: number
}

// type energySourceType = Tombstone | StructureStorage | StructureContainer | StructureLink
// type energyTargetType = StructureStorage | StructureSpawn | StructureExtension | StructureTower
