

function get_harvest_source(creep) {
    let source = creep.pos.findClosestByPath(FIND_SOURCES);
    return source;
}

function get_transfer_source(creep) {
    let spawn = Game.getObjectById(creep.memory.spawn_id);
    let spawn_room = spawn.room;
    if (spawn.energy < spawn.energyCapacity) {
        return spawn;
    }

    // Extensions
    let extension = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: (s) => {
            return (s.structureType === STRUCTURE_EXTENSION) &&
                (s.energy < s.energyCapacity)
        }
    });
    return extension;
}

function assign_harvest_source(creep, room) {
    let sources = room.find(FIND_SOURCES);
    for (let source of sources) {
        if (!(source.id in Memory.source_miners)) {
            Memory.source_miners[source.id] = [];
        }
        let source_miners = Memory.source_miners[source.id];
        let total_work_assigned = _.sum(_.map(source_miners, (c_id) => {
            let c = Game.getObjectById(c_id);
            return _.filter(c.body, {type: WORK}).length;
        }));
        if (total_work_assigned < 5) {
            source_miners.push(creep.id);
            creep.memory.source_id = source.id;
            return true;
        }
    }
    return false;
}

function init() {
    Memory.source_miners = {};
}

module.exports = {
    "get_harvest_source": get_harvest_source,
    "get_transfer_source": get_transfer_source,
    "init": init,
};