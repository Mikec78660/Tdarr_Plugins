"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Keep First N Audio Streams',
    description: 'Keeps only the first N audio streams and removes all others.',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Number of Streams to Keep',
            name: 'streamsToKeep',
            type: 'number',
            defaultValue: '1',
            inputUI: {
                type: 'slider',
                sliderOptions: {
                    min: 0,
                    max: 10,
                },
            },
            tooltip: 'Enter the number of audio streams to keep (starting from the first)',
        },
    ],
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
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var streamsToKeep = Number(args.inputs.streamsToKeep);
    // Get all audio streams from the file, preserving their original order
    var audioStreams = args.variables.ffmpegCommand.streams
        .filter(function (stream) { return stream.codec_type === 'audio'; });
    args.jobLog("Total audio streams found: ".concat(audioStreams.length));
    args.jobLog("Keeping first ".concat(streamsToKeep, " audio streams"));
    var keptCount = 0;
    var removedCount = 0;
    // Mark audio streams for removal if they are beyond the keep limit
    audioStreams.forEach(function (stream, index) {
        if (index >= streamsToKeep) {
            if (!stream.removed) {
                stream.removed = true;
                removedCount += 1;
                args.jobLog("Removing audio stream index ".concat(stream.index, " (position ").concat(index + 1, ")"));
            }
        }
        else {
            keptCount += 1;
            args.jobLog("Keeping audio stream index ".concat(stream.index, " (position ").concat(index + 1, ")"));
            // Add copy codec to preserve original audio format
            if (!stream.outputArgs) {
                stream.outputArgs = [];
            }
            stream.outputArgs.push("-c:".concat(stream.index), 'copy');
            args.jobLog("Setting copy codec for audio stream index ".concat(stream.index));
        }
    });
    args.jobLog("Kept ".concat(keptCount, " audio stream(s), removed ").concat(removedCount, " audio stream(s)"));
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
