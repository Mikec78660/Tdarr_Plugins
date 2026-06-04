"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
var details = function () { return ({
    name: 'H264 Metadata Crop Detect',
    description: 'Detects black bars and adds H264 metadata crop values without re-encoding. Runs cropdetect at 300s and 600s.',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.00.00',
    sidebarPosition: -1,
    icon: 'faCrop',
    inputs: [
        {
            label: 'Threshold',
            name: 'threshold',
            type: 'number',
            defaultValue: '24',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Threshold for crop detection. If y-offset is less than or equal to this value, it will be ignored. Default is 24.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'No crop detected or crop below threshold',
        },
        {
            number: 2,
            tooltip: 'Crop metadata added',
        },
        {
            number: 3,
            tooltip: 'Inconsistent crop values detected',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    var execSync = require('child_process').execSync;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var threshold = Number(args.inputs.threshold);
    var ffmpegPath = args.ffmpegPath;
    var path = args.inputFileObj._id;
    var runCropDetect = function (ss) {
        // Run ffmpeg with cropdetect for 100 frames starting at ss
        var cmd = "\"".concat(ffmpegPath, "\" -ss ").concat(ss, " -i \"").concat(path, "\" -vframes 100 -vf cropdetect -f null - 2>&1");
        try {
            var output = execSync(cmd).toString();
            var lines = output.split('\n');
            var crops_1 = [];
            lines.forEach(function (line) {
                if (line.includes('crop=')) {
                    // Extract the crop=w:h:x:y part
                    var match = line.match(/crop=([0-9]+:[0-9]+:[0-9]+:[0-9]+)/);
                    if (match) {
                        crops_1.push(match[1]);
                    }
                }
            });
            return crops_1;
        }
        catch (e) {
            args.jobLog("Error running cropdetect: ".concat(e.message));
            return [];
        }
    };
    args.jobLog('Running cropdetect at 300s...');
    var crops300 = runCropDetect(300);
    args.jobLog('Running cropdetect at 600s...');
    var crops600 = runCropDetect(600);
    var allCrops = crops300.concat(crops600);
    if (allCrops.length === 0) {
        args.jobLog('No crop detected.');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    // Check if all lines give an equal crop value
    var firstCrop = allCrops[0];
    var allEqual = allCrops.every(function (c) { return c === firstCrop; });
    if (!allEqual) {
        args.jobLog('Inconsistent crop values detected across lines.');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 3,
            variables: args.variables,
        };
    }
    // If consistent, parse values: w:h:x:y
    var parts = firstCrop.split(':');
    var y = parseInt(parts[3], 10);
    args.jobLog("Detected consistent crop: ".concat(firstCrop, " (y=").concat(y, ")"));
    if (y <= threshold) {
        args.jobLog("Crop y (".concat(y, ") is below or equal to threshold (").concat(threshold, "). Skipping crop."));
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    // Add metadata arguments to the ffmpegCommand
    // Using overallOuputArguments (note the typo in Tdarr)
    // We do NOT add -map 0 or -c copy here because Tdarr's executor handles mapping individually.
    // Adding them here would cause duplicate tracks.
    args.variables.ffmpegCommand.overallOuputArguments.push('-bsf:v:0', "h264_metadata=crop_top=".concat(y, ":crop_bottom=").concat(y));
    args.variables.ffmpegCommand.shouldProcess = true;
    args.jobLog("Added H264 metadata crop arguments: crop_top=".concat(y, ", crop_bottom=").concat(y));
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 2,
        variables: args.variables,
    };
};
exports.plugin = plugin;
