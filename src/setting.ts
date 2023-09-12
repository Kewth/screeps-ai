// 优先级从前往后
export const maintainCreepList: spawnTask[] = [

    // 自定义房间
    {
        roomName: 'sim', creepName: 'C',
        body: [CARRY, CARRY, MOVE],
        memory: {
            role: 'carrier',
            taskName: 'auto',
        },
        num: 1,
    },
    {
        roomName: 'sim', creepName: 'H',
        body: [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE],
        memory: {
            role: 'harvester',
            taskName: 'auto',
            sourceID: 'd98a6a98c8dad0aa374b16d2',
        },
        num: 1,
    },
    {
        roomName: 'sim', creepName: 'R',
        body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
        memory: {
            role: 'repairer',
            taskName: 'auto',
        },
        num: 2,
    },

    // Shard3 世界
    // carrier
    {
        roomName: 'E26S27',
        creepName: 'C',
        body: [
            CARRY, CARRY, CARRY, CARRY,
            MOVE, MOVE,
        ], // 300
        memory: {
            role: 'carrier',
            taskName: 'auto',
        },
        num: 1,
    },
    // harvester
    {
        roomName: 'E26S27',
        creepName: 'H',
        body: [
            WORK, WORK, WORK, WORK, WORK,
            MOVE,
        ], // 550
        memory: {
            role: 'harvester',
            taskName: 'auto',
            sourceFlagName: 'source1'
        },
        num: 1,
    },
    // repairer
    {
        roomName: 'E26S27',
        creepName: 'R',
        body: [
            WORK, WORK,
            CARRY, CARRY,
            MOVE, MOVE,
        ], // 200
        memory: {
            role: 'repairer',
            taskName: 'auto',
        },
        num: 1,
    },
    // upgrader
    {
        roomName: 'E26S27',
        creepName: 'U',
        body: [
            WORK, WORK, WORK, WORK,
            CARRY, CARRY,
            MOVE, MOVE, MOVE,
        ], // 650
        memory: {
            role: 'upgrader',
            taskName: 'auto',
        },
        num: 1,
    },
    // 外矿开采
    // harvester
    {
        roomName: 'E26S27',
        creepName: 'fH',
        body: [
            WORK, WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE,
        ], // 700
        memory: {
            role: 'farHarvester',
            taskName: 'auto',
            sourceFlagName: 'source2'
        },
        num: 1,
    },
    // harvester
    // {
    //     roomName: 'E26S27',
    //     creepName: 'ffH',
    //     body: [
    //         WORK, WORK, WORK, WORK, WORK,
    //         MOVE, MOVE, MOVE,
    //     ], // 700
    //     memory: {
    //         role: 'farHarvester',
    //         taskName: 'auto',
    //         sourceFlagName: 'source3'
    //     },
    //     num: 1,
    // },
    // carrier
    // move:carry = 1:1 保证移动速度
    // 一个来回约 120 tick
    {
        roomName: 'E26S27',
        creepName: 'fC',
        body: [
            CARRY, CARRY, CARRY, CARRY, CARRY,
            CARRY, CARRY, CARRY, CARRY, CARRY,
            CARRY, CARRY,
            MOVE, MOVE, MOVE, MOVE, MOVE,
            MOVE, MOVE, MOVE, MOVE, MOVE,
            MOVE, MOVE,
        ], // 1200
        memory: {
            role: 'farCarrier',
            taskName: 'auto',
            sourceFlagName: 'source2'
        },
        num: 1,
    },
    // {
    //     roomName: 'E26S27',
    //     creepName: 'ffC',
    //     body: [
    //         CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY,
    //         MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,
    //     ], // 700
    //     memory: {
    //         role: 'farCarrier',
    //         taskName: 'auto',
    //         sourceFlagName: 'source3'
    //     },
    //     num: 1,
    // },
    // reserver
    {
        roomName: 'E26S27',
        creepName: 'RE',
        body: [
            CLAIM, CLAIM,
            MOVE, MOVE,
        ], // 1300
        memory: {
            role: 'farReserver',
            taskName: 'auto',
            targetFlagName: 'reserve1'
        },
        num: 1,
    },
]
