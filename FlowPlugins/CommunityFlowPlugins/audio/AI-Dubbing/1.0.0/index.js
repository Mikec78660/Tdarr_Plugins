"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'AI-Dubbing',
    nameUI: {
        type: 'text',
        style: {
            height: '50px',
        },
    },
    description: 'AI Dubbing plugin for Tdarr Flow. Prints DUBBING to the output log.',
    style: {
        borderColor: 'orange',
        borderRadius: '10px',
        backgroundColor: '#ff9900',
    },
    tags: 'ai,dubbing,translation',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faMicrophone',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    // Print DUBBING to the output log
    args.jobLog('DUBBING');
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
