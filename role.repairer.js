const finder = require('finder');
const _ = require('lodash');

const State = {
    HARVEST: "harvest",
    REPAIR: "repair",
    UPGRADE_ROOM: "upgrade_room",
};

function get_repair_target(creep) {
    let target_id = creep.memory.repair_target_id;
    let target = null;
    if (target_id) {
        target = Game.getObjectById(target_id);
        if (target && target.hits < target.hitsMax) {
            creep.say("🔧");
            return target;
        }
    }
    let weak_structures = _.filter(
        creep.room.find(FIND_STRUCTURES),
        (s) => {
            if (s.structureType === STRUCTURE_ROAD) {
                return (s.hits / s.hitsMax) < 0.8;
            }
            return s.hits < s.hitsMax;
        }
    );

    let weakest_structures = _.sortBy(
        weak_structures,
        (s) => {return (s.hits / s.hitsMax);}
    );

    if (weakest_structures.length) {
        target = weakest_structures[0];
        creep.memory.repair_target_id = target.id;
        return target;
    }
    return null;
}

const State_Run = {
    [State.HARVEST]: (creep) => {
        // State Transition
        if (creep.carry.energy >= creep.carryCapacity) {
            // HARVEST => REPAIR
            creep.memory.state = State.REPAIR;
            State_Run[creep.memory.state](creep);
            return;
        }

        // Harvest
        let source = finder.get_harvest_source(creep);
        if (!source) {
            return;
        }
        if(creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
    },
    [State.REPAIR]: (creep) => {
        // State Transition
        if (creep.carry.energy <= 0) {
            // REPAIR => HARVEST
            creep.memory.state = State.HARVEST;
            creep.say("⛏");
            State_Run[creep.memory.state](creep);
            return;
        }
        let repair_target = get_repair_target(creep);
        if (repair_target) {
            if (creep.repair(repair_target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(repair_target);
            }
        } else {
            // REPAIR => UPGRADE_ROOM
            creep.memory.state = State.UPGRADE_ROOM;
            State_Run[creep.memory.state](creep);
        }
    },
    [State.UPGRADE_ROOM]: (creep) => {
        // State Transition
        if (creep.carry.energy <= 0) {
            // UPGRADE_ROOM => HARVEST
            creep.memory.state = State.HARVEST;
            creep.say("⛏");
            State_Run[creep.memory.state](creep);
            return;
        }

        // Upgrade Room
        if(creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
    },
};

module.exports = {

    run: (creep) => {
        State_Run[creep.memory.state](creep);
    },

    init: (creep) => {
        creep.memory.state = State.HARVEST;
    },
};