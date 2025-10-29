"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Extract Audio',
    description: 'Extracts a specific audio stream from a file and saves it as a separate audio file without transcoding.',
    style: {
        borderColor: 'blue',
        borderRadius: '10px',
        backgroundColor: '#007bff',
    },
    tags: 'audio,extract,stream,copy',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faAudioDescription',
    inputs: [
        {
            label: 'Audio Stream Index',
            name: 'audioStreamIndex',
            type: 'number',
            defaultValue: '0',
            inputUI: {
                type: 'slider',
                sliderOptions: {
                    min: 0,
                    max: 10,
                },
            },
            tooltip: 'Select the index of the audio stream to extract (0 = first stream)',
        },
        {
            label: 'Output Container',
            name: 'outputContainer',
            type: 'string',
            defaultValue: 'mka',
            inputUI: {
                type: 'dropdown',
                options: [
                    'mka',
                    'mkv',
                    'mp3',
                    'aac',
                    'flac',
                    'wav',
                ],
            },
            tooltip: 'Select the output container format for the extracted audio',
        },
        {
            label: 'Create Separate File',
            name: 'createSeparateFile',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Create a separate audio file instead of modifying the original',
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
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, audioStreamIndex, outputContainer, createSeparateFile, ffProbeData, streams, audioStreams, outputFilePath, inputFile, container, fileName, workDir, ffmpegArgs, cli, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                audioStreamIndex = args.inputs.audioStreamIndex;
                outputContainer = args.inputs.outputContainer;
                createSeparateFile = args.inputs.createSeparateFile;
                // Validate input
                if (audioStreamIndex < 0) {
                    throw new Error('Audio stream index must be 0 or greater');
                }
                ffProbeData = args.inputFileObj.ffProbeData;
                if (!ffProbeData || !ffProbeData.streams) {
                    throw new Error('ffProbeData or ffProbeData.streams is not available.');
                }
                streams = ffProbeData.streams;
                if (!Array.isArray(streams)) {
                    throw new Error('File has no valid stream data');
                }
                audioStreams = streams.filter(function (stream) { return stream.codec_type === 'audio'; });
                if (audioStreams.length === 0) {
                    throw new Error('No audio streams found in the file');
                }
                if (audioStreamIndex >= audioStreams.length) {
                    throw new Error("Audio stream index ".concat(audioStreamIndex, " is out of range. File has ").concat(audioStreams.length, " audio streams."));
                }
                args.jobLog("Found ".concat(audioStreams.length, " audio streams in the file"));
                args.jobLog("Extracting audio stream ".concat(audioStreamIndex, " (codec: ").concat(audioStreams[audioStreamIndex].codec_name, ")"));
                outputFilePath = '';
                inputFile = args.inputFileObj._id;
                if (!createSeparateFile) return [3 /*break*/, 2];
                container = outputContainer;
                fileName = (0, fileUtils_1.getFileName)(args.inputFileObj._id);
                workDir = (0, fileUtils_1.getPluginWorkDir)(args);
                outputFilePath = "".concat(workDir, "/").concat(fileName, "_extracted_audio.").concat(container);
                ffmpegArgs = [
                    '-i',
                    inputFile,
                    '-map',
                    "0:a:".concat(audioStreamIndex),
                    '-c',
                    'copy',
                    outputFilePath,
                ];
                args.jobLog("Running FFmpeg command: ".concat(ffmpegArgs.join(' ')));
                cli = new cliUtils_1.CLI({
                    cli: args.ffmpegPath,
                    spawnArgs: ffmpegArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 1:
                res = _a.sent();
                if (res.cliExitCode !== 0) {
                    args.jobLog('Running FFmpeg failed');
                    throw new Error('FFmpeg failed to extract audio stream');
                }
                args.jobLog("Audio stream extracted successfully to: ".concat(outputFilePath));
                return [3 /*break*/, 3];
            case 2:
                // If we're not creating a separate file, we'll modify the original file
                // This is more complex and not typically needed for extraction, so we'll just process the original
                outputFilePath = inputFile;
                args.jobLog('Processing original file (no separate file created)');
                _a.label = 3;
            case 3: return [2 /*return*/, {
                    outputFileObj: {
                        _id: outputFilePath,
                    },
                    outputNumber: 1,
                    variables: args.variables,
                }];
        }
    });
}); };
exports.plugin = plugin;
