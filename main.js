const _ = require('lodash');
const roles = require('roles');
const finder = require('finder');

// Dynamic role library import
const role_lib = {};
for (let role of [
    "harvester",
    "builder",
    "repairer",
    "miner",
    "transporter",
    "upgrader",
]) {
    role_lib[role] = require("role." + role);
}

// Do first INIT
if (!Memory.Init) {
    Memory.Init = true;

    finder.init();
}

const State = {
    LEVEL_ONE: 1,
    LEVEL_TWO: 2,
    LEVEL_THREE: 3,
    LEVEL_FOUR: 4,
    LEVEL_FIVE: 5,
    LEVEL_SIX: 6,
    LEVEL_SEVEN: 7,
    LEVEL_EIGHT: 8,
};

// CREEPS
for (let name in Memory.creeps) {

    // Delete old creep
    if(! Game.creeps[name]) {
        delete Memory.creeps[name];
        continue;
    }
    let creep = Game.creeps[name];

    // Init creep
    if (!creep.memory.inited) {
        role_lib[creep.memory.role].init(creep);
        creep.memory.inited = true;
    }

    // Run creep
    role_lib[creep.memory.role].run(creep);
}

function count_open(source) {
    let pos = source.pos;
    let structures = _.filter(source.room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true), {terrain: "wall"});
    return 9 - structures.length;
}

// SPAWNING STRATEGIES
const State_Run = {
    [State.LEVEL_ONE]: (spawn) => {

        // TODO: only build fast harvesters for sources without source keepers guarding them
        let sources = spawn.room.find(FIND_SOURCES);
        let harvester_count = _.sum(_.map(sources, count_open));

        let goals = [
            {
                role: "harvester",
                count: harvester_count - 4,
                parts: [MOVE, CARRY, WORK, MOVE],
            },
            {
                role: "builder",
                count: 1,
                parts: [CARRY, WORK, MOVE],
            },
            {
                role: "repairer",
                count: 1,
                parts: [CARRY, WORK, MOVE],
            },
        ];

        for (let goal of goals) {
            goal.cost = roles.get_cost(goal.parts);
            let count = _.filter(Game.creeps, (creep) => creep.memory.role === goal.role).length;
            if (count < goal.count) {
                if (spawn.energy >= goal.cost) {
                    let name = spawn.name + "-" + goal.role + "-" + Game.time.toString();
                    let err_code = spawn.spawnCreep(goal.parts, name, {
                        memory: {
                            "role": goal.role,
                            "spawn_id": spawn.id,
                        }
                    });
                }
                break;
            }
        }
    },
    [State.LEVEL_TWO]: (spawn) => {
        let sources = spawn.room.find(FIND_SOURCES);
        let miner_count = sources.length;

        let goals = [
            {
                role: "repairer",
                count: 1,
                parts: [CARRY, WORK, MOVE],
            },
            {
                role: "miner",
                count: 1,
                parts: [WORK, WORK, WORK, WORK, WORK, MOVE],
            },
            {
                role: "transporter",
                count: 1,
                parts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
            },
            {
                role: "miner",
                count: miner_count - 1,
                parts: [WORK, WORK, WORK, WORK, WORK, MOVE],
            },
            {
                role: "transporter",
                count: miner_count - 1,
                parts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
            },
            {
                role: "builder",
                count: 2,
                parts: [CARRY, CARRY, CARRY, CARRY, WORK, WORK, MOVE, MOVE, MOVE],
            },
            {
                role: "upgrader",
                count: 1,
                parts: [WORK, WORK, WORK, WORK, WORK, MOVE],
            },
        ];

        for (let goal of goals) {
            goal.cost = roles.get_cost(goal.parts);
            let count = _.filter(Game.creeps, (creep) => creep.memory.role === goal.role).length;
            if (count < goal.count) {
                if (spawn.energy >= goal.cost) {
                    let name = spawn.name + "-" + goal.role + "-" + Game.time.toString();
                    let err_code = spawn.spawnCreep(goal.parts, name, {
                        memory: {
                            "role": goal.role,
                            "spawn_id": spawn.id,
                        }
                    });
                }
                break;
            }
        }
    },
}

// SPAWNS
for (let name in Game.spawns) {
    if (! Game.spawns.hasOwnProperty(name)) continue;
    let spawn = Game.spawns[name];
    if (!spawn.memory.state) {
        spawn.memory.state = State.INIT;
    }
    spawn.memory.state = State.LEVEL_ONE;
    // Run spawning
    State_Run[spawn.memory.state](spawn);
}