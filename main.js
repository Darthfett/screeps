const _ = require('lodash');
const roles = require('roles');

const role_types = [
    "harvester",
    "builder",
    "repairer",
];

const role_lib = {};

const State = {
    INIT: 1,
};

// INIT
for (let role of role_types) {
    role_lib[role] = require("role." + role);
}

// CREEPS
for (let name in Game.creeps) {
    if (! Game.creeps.hasOwnProperty(name)) continue;

    // Delete old creep
    let creep = Game.creeps[name];
    if(! creep) {
        delete Game.creeps[name];
        continue;
    }

    // Init creep
    if (!("inited" in creep.memory)) {
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
    [State.INIT]: (spawn) => {

        // TODO: only build fast harvesters for sources without source keepers guarding them
        let sources = spawn.room.find(FIND_SOURCES);
        let harvester_count = _.sum(_.map(sources, count_open));

        let goals = [
            {
                role: "harvester",
                count: harvester_count,
                parts: [MOVE, CARRY, WORK, MOVE],
            },
            {
                role: "builder",
                count: 2,
                parts: [CARRY, WORK, MOVE],
            },
            {
                role: "repairer",
                count: 2,
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
}

// SPAWNS
for (let name in Game.spawns) {
    if (! Game.spawns.hasOwnProperty(name)) continue;
    let spawn = Game.spawns[name];
    if (!spawn.memory.state) {
        spawn.memory.state = State.INIT;
    }
    // Run spawning
    State_Run[spawn.memory.state](spawn);
}