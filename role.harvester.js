const finder = require('finder');
const _ = require('lodash');

const State = {
    HARVEST: "harvest",
    TRANSFER: "transfer",
    UPGRADE_ROOM: "upgrade_room",
};

const State_Run = {
    [State.HARVEST]: (creep) => {
        // State Transition
        if (creep.carry.energy >= creep.carryCapacity) {
            // HARVEST => TRANSFER
            creep.memory.state = State.TRANSFER;
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
    [State.TRANSFER]: (creep) => {
        // State Transition
        if (creep.carry.energy <= 0) {
            // TRANSFER => HARVEST
            creep.memory.state = State.HARVEST;
            creep.say("⛏");
            State_Run[creep.memory.state](creep);
            return;
        }

        let transfer_source = finder.get_transfer_source(creep);
        if (transfer_source) {
            // Transfer
            if(creep.transfer(transfer_source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(transfer_source);
            }
        } else {
            // TRANSFER => UPGRADE_ROOM
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