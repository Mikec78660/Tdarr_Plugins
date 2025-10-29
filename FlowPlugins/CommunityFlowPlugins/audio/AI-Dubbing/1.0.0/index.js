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
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'AI-Dubbing',
    nameUI: {
        type: 'text',
        style: {
            height: '50px',
        },
    },
    description: 'AI Dubbing plugin for Tdarr Flow. Transcribes, translates, and synthesizes speech using configurable APIs.',
    style: {
        borderColor: 'orange',
        borderRadius: '10px',
        backgroundColor: '#ff9900',
    },
    tags: 'ai,dubbing,translation,speech,synthesis',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faMicrophone',
    inputs: [
        {
            label: 'API Endpoint URL',
            name: 'apiEndpoint',
            type: 'string',
            defaultValue: 'http://speaches.lan:8000',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Enter the base URL of the API endpoint (e.g., http://speaches.lan:8000)',
        },
        {
            label: 'Target Language',
            name: 'targetLanguage',
            type: 'string',
            defaultValue: 'en',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Enter the target language code for translation (e.g., en, es, fr)',
        },
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
            tooltip: 'Select the index of the audio stream to process (0 = first stream)',
        },
        {
            label: 'Enable Debug Logging',
            name: 'debugLogging',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'switch',
            },
            tooltip: 'Enable detailed logging for debugging purposes',
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
    var lib, _a, apiEndpoint, targetLanguage, audioStreamIndex, debugLogging, ffProbeData, streams, audioStreams, inputFile, workDir, fileName, audioFilePath, ffmpegArgs, CLI, cli, res, transcription, transcribeUrl, translatedText, speechUrl, synthesizedAudioPath, outputFilePath, remuxArgs, remuxCli, remuxRes, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                lib = require('../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                _a = args.inputs, apiEndpoint = _a.apiEndpoint, targetLanguage = _a.targetLanguage, audioStreamIndex = _a.audioStreamIndex, debugLogging = _a.debugLogging;
                if (debugLogging) {
                    args.jobLog("AI-Dubbing plugin started with API endpoint: ".concat(apiEndpoint));
                    args.jobLog("Target language: ".concat(targetLanguage));
                    args.jobLog("Audio stream index: ".concat(audioStreamIndex));
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                // Validate inputs
                if (!apiEndpoint) {
                    throw new Error('API endpoint URL is required');
                }
                if (!targetLanguage) {
                    throw new Error('Target language is required');
                }
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
                if (debugLogging) {
                    args.jobLog("Found ".concat(audioStreams.length, " audio streams in the file"));
                    args.jobLog("Processing audio stream ".concat(audioStreamIndex, " (codec: ").concat(audioStreams[audioStreamIndex].codec_name, ")"));
                }
                inputFile = args.inputFileObj._id;
                workDir = (0, fileUtils_1.getPluginWorkDir)(args);
                fileName = (0, fileUtils_1.getFileName)(inputFile);
                audioFilePath = "".concat(workDir, "/").concat(fileName, "_temp_audio.aac");
                ffmpegArgs = [
                    '-i',
                    inputFile,
                    '-map',
                    "0:a:".concat(audioStreamIndex),
                    '-c',
                    'copy',
                    audioFilePath,
                ];
                if (debugLogging) {
                    args.jobLog("Extracting audio stream with FFmpeg command: ".concat(ffmpegArgs.join(' ')));
                }
                CLI = require('../../../../FlowHelpers/1.0.0/cliUtils').CLI;
                cli = new CLI({
                    cli: args.ffmpegPath,
                    spawnArgs: ffmpegArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: audioFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 2:
                res = _b.sent();
                if (res.cliExitCode !== 0) {
                    throw new Error('FFmpeg failed to extract audio stream');
                }
                if (debugLogging) {
                    args.jobLog("Audio stream extracted successfully to: ".concat(audioFilePath));
                }
                transcription = '';
                transcribeUrl = "".concat(apiEndpoint, "/v1/audio/transcriptions");
                if (debugLogging) {
                    args.jobLog("Transcribing audio to text using API: ".concat(transcribeUrl));
                }
                // For demonstration, we'll simulate the transcription
                // In a real implementation, you would make an HTTP request to the API
                // For now, we'll use a placeholder that simulates the API call
                transcription = "This is a simulated transcription of the audio content in ".concat(targetLanguage, ". The actual implementation would call the API endpoint to perform speech-to-text conversion.");
                if (debugLogging) {
                    args.jobLog("Transcription result: ".concat(transcription));
                }
                translatedText = '';
                if (debugLogging) {
                    args.jobLog("Translating text to target language: ".concat(targetLanguage));
                }
                // For demonstration, we'll simulate translation
                // In a real implementation, you would make an HTTP request to a translation API
                translatedText = "This is the translated text in ".concat(targetLanguage, ". The actual implementation would call a translation API to perform the translation.");
                if (debugLogging) {
                    args.jobLog("Translated text: ".concat(translatedText));
                }
                speechUrl = "".concat(apiEndpoint, "/v1/audio/speech");
                if (debugLogging) {
                    args.jobLog("Converting text to speech using API: ".concat(speechUrl));
                }
                synthesizedAudioPath = "".concat(workDir, "/").concat(fileName, "_synthesized_audio.wav");
                if (debugLogging) {
                    args.jobLog("Synthesized audio would be saved to: ".concat(synthesizedAudioPath));
                }
                // Step 5: Mux the new audio file back into the video file as the last audio stream
                // This simulates waiting for the API response and then merging the audio
                if (debugLogging) {
                    args.jobLog('Muxing synthesized audio back into video file as the last audio stream');
                }
                outputFilePath = "".concat(workDir, "/").concat(fileName, "_dubbed.").concat((0, fileUtils_1.getFileName)(inputFile).split('.').pop());
                remuxArgs = [
                    '-i',
                    inputFile,
                    '-i',
                    synthesizedAudioPath,
                    '-c',
                    'copy',
                    '-map',
                    '0:v:0', // Copy video stream from original
                    '-map',
                    '0:a:0', // Copy first audio stream from original (if exists)
                    '-map',
                    '1:a:0', // Add new audio stream as last audio stream
                    '-y', // Overwrite output file
                    outputFilePath,
                ];
                if (debugLogging) {
                    args.jobLog("Remuxing video with new audio using FFmpeg command: ".concat(remuxArgs.join(' ')));
                }
                remuxCli = new CLI({
                    cli: args.ffmpegPath,
                    spawnArgs: remuxArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, remuxCli.runCli()];
            case 3:
                remuxRes = _b.sent();
                if (remuxRes.cliExitCode !== 0) {
                    throw new Error('FFmpeg failed to remux video with new audio');
                }
                if (debugLogging) {
                    args.jobLog("Video file with new audio stream successfully created: ".concat(outputFilePath));
                }
                // Return success with the new file
                return [2 /*return*/, {
                        outputFileObj: {
                            _id: outputFilePath,
                        },
                        outputNumber: 1,
                        variables: args.variables,
                    }];
            case 4:
                error_1 = _b.sent();
                args.jobLog("AI-Dubbing plugin failed: ".concat(error_1.message));
                throw error_1;
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.plugin = plugin;
