const roles = require('roles');
const _ = require('lodash');

const State = {
    HARVEST: "harvest",
    BUILD: "build",
    UPGRADE_ROOM: "upgrade_room",
};

const State_Run = {
    [State.HARVEST]: (creep) => {
        // State Transition
        if (creep.carry.energy >= creep.carryCapacity) {
            let construction_site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            if (construction_site) {
                creep.memory.state = State.BUILD;
                creep.memory.site_id = construction_site.id;
            } else {
                creep.memory.state = State.UPGRADE_ROOM;
            }
            State_Run[creep.memory.state](creep);

            return;
        }

        // Harvest
        let source = roles.get_harvest_source(creep);
        if (!source) {
            return;
        }
        if(creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
    },
    [State.BUILD]: (creep) => {
        // State Transition
        if (creep.carry.energy <= 0) {
            creep.memory.state = State.HARVEST;
            creep.say("⛏");
            State_Run[creep.memory.state](creep);
            return;
        }
        let site = Game.getObjectById(creep.memory.site_id)
        if (!site || !(site instanceof ConstructionSite)) {
            site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            if (!site) {
                creep.memory.state = State.UPGRADE_ROOM;
                State_Run[creep.memory.state](creep);
                return;
            }
            creep.memory.site_id = site.id;
        }

        // Build site
        if(creep.build(site) === ERR_NOT_IN_RANGE) {
            creep.moveTo(site);
        }

    },
    [State.UPGRADE_ROOM]: (creep) => {
        // State Transition
        if (creep.carry.energy <= 0) {
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