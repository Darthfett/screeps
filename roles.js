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

module.exports = {
    "get_cost": get_cost,
};