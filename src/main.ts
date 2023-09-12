import { checkMemory } from "memory";
import { mountAll } from "mount";
import { ErrorMapper } from "utils/ErrorMapper";

// 挂载只需执行一次
mountAll()

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  checkMemory()

  Object.values(Game.rooms).forEach( room => {
    room.work()
  })
  Object.values(Game.creeps).forEach( creep => {
    creep.work()
  })

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      Memory.creepSpawningTaskLiveCount[Memory.creeps[name].taskName] --
      delete Memory.creeps[name]
    }
  }
})
