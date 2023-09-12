import { makeBody, makeTask } from "utils/other";

// 优先级从前往后
export const maintainCreepList: spawnTask[] = [

    // 自定义房间
    makeTask('sim', 'H', makeBody({work: 1, move: 1}), {
        role: 'harvester', taskName: 'auto', sourceFlagName: 'source'
    }, 1),

    // Shard3 世界

    // carrier
    makeTask('E26S27', 'C', makeBody({carry: 4, move: 2}), {
        role: 'carrier', taskName: 'auto',
    }, 1),
    // harvester
    makeTask('E26S27', 'H', makeBody({work: 5, move: 1}), {
        role: 'harvester', taskName: 'auto', sourceFlagName: 'source1'
    }, 1),
    // repairer
    makeTask('E26S27', 'R', makeBody({work: 2, carry: 2, move: 2}), {
        role: 'repairer', taskName: 'auto',
    }, 1),
    // upgrader
    makeTask('E26S27', 'U', makeBody({work: 4, carry: 2, move: 3}), {
        role: 'upgrader', taskName: 'auto',
    }, 1),
    // 外矿开采
    // harvester
    makeTask('E26S27', 'fH', makeBody({work: 5, move: 3}), {
        role: 'farHarvester', taskName: 'auto', sourceFlagName: 'source2'
    }, 1),
    // carrier
    // move:carry = 1:1 保证移动速度
    // 一个来回约 120 tick 以内
    makeTask('E26S27', 'fC', makeBody({carry: 12, move: 12}), {
        role: 'farCarrier', taskName: 'auto', sourceFlagName: 'source2'
    }, 1),
    // reserver
    makeTask('E26S27', 'RE', makeBody({claim: 2, move: 2}), {
        role: 'farReserver', taskName: 'auto', targetFlagName: 'reserve1'
    }, 1),
    // builder
    makeTask('E26S27', 'fB', makeBody({work: 4, carry: 4, move: 4}), {
        role: 'farBuilder', taskName: 'auto',
    }, 1)
]
