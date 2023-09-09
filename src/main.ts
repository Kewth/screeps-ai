import { Builder } from "role/Builder";
import { Harvester } from "role/Harvester";
import { Repairer } from "role/Repairer";
import { Transfer } from "role/Transfer";
import { Upgrader } from "role/Upgrader";
import { ErrorMapper } from "utils/ErrorMapper";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  // 孵化优先级从后往前
  Upgrader.work_all_creeps();
  Builder.work_all_creeps();
  Repairer.work_all_creeps();
  Transfer.work_all_creeps();
  Harvester.work_all_creeps();

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
