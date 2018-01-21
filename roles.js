const _ = require('lodash');

const part_costs = {
    [MOVE]: 50,
    [WORK]: 100,
    [CARRY]: 50,
    [ATTACK]: 80,
    [RANGED_ATTACK]: 150,
    [HEAL]: 250,
    [TOUGH]: 10,
    [CLAIM]: 600,
};

function get_cost(parts) {
    return _.sum(_.map(parts, (part) => part_costs[part]));
}

function get_harvest_source(creep) {
    let sources = creep.room.find(FIND_SOURCES);
    sources = _.sortBy(sources, s => creep.pos.getRangeTo(s));
    if (sources.length) {
        return sources[0];
    }
    return null;
}

module.exports = {
    "part_costs": part_costs,
    "get_cost": get_cost,
    "get_harvest_source": get_harvest_source,
};