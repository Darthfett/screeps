const finder = require('finder');
const _ = require('lodash');

const State = {
    STAND_ON_CONTAINER: "stand_on_container",
    HARVEST: "harvest",
};

function get_nearby_containers(pos) {
    let containers = pos.findInRange(FIND_MY_STRUCTURES, 1, {
        filter: (s) => {
            return s.structureType === STRUCTURE_CONTAINER;
        },
    });
    return containers;
}

function is_standing_on_container(creep) {
    let structures = creep.pos.lookFor(LOOK_STRUCTURES);
    let containers = _.filter(structures, (s) => {
        return s.structureType === STRUCTURE_CONTAINER;
    });
    return containers.length > 0;
}

const State_Run = {
    [State.STAND_ON_CONTAINER]: (creep) => {
        if (is_standing_on_container(creep)) {
            // STAND_ON_CONTAINER => HARVEST
            creep.memory.state = State.HARVEST;
            State_Run[creep.memory.state](creep);
            return;
        }
        let source = Game.getObjectById(creep.memory.source_id);
        if (!source) {
            console.log("Error: No source for " + creep.name);
            return;
        }
        let containers = get_nearby_containers(source.pos);
        if (containers.length) {
            creep.moveTo(containers[0]);
        } else {
            creep.moveTo(source);
        }
    },
    [State.HARVEST]: (creep) => {
        let source = Game.getObjectById(creep.memory.source_id);
        if (!source) {
            console.log("Error: No source for " + creep.name);
            return;
        }

        if (!is_standing_on_container(creep)) {
            if (get_nearby_containers(source.pos).length) {
                // HARVEST => STAND_ON_CONTAINER
                creep.memory.state = State.STAND_ON_CONTAINER;
                State_Run[creep.memory.state](creep);
                return;
            }
        }
        // Harvest
        if(creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
    },
};

module.exports = {

    run: (creep) => {
        State_Run[creep.memory.state](creep);
    },

    init: (creep) => {
        creep.memory.state = State.HARVEST;
        finder.assign_harvest_source(creep, creep.room);
    },
};