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
var details = function () { return ({
    name: 'Inject RPU (Dolby Vision)',
    description: 'Injects extracted RPU data back into a video. Handles MKV by extracting raw HEVC bitstream first.',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faUpload',
    inputs: [
        {
            label: 'Dovi Tool Path',
            name: 'doviToolPath',
            type: 'string',
            defaultValue: 'dovi_tool',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Path to the dovi_tool executable.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'RPU injected successfully',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, execSync, fs, doviToolPath, ffmpegPath, inputPath, rpuPath, workDir, fileName, rawHevcPath, rawInjectedPath, extraArgs, extractCmd, injectCmd;
    return __generator(this, function (_a) {
        lib = require('../../../../../methods/lib')();
        execSync = require('child_process').execSync;
        fs = require('fs');
        args.inputs = lib.loadDefaultValues(args.inputs, details);
        doviToolPath = String(args.inputs.doviToolPath);
        ffmpegPath = args.ffmpegPath;
        inputPath = args.inputFileObj._id;
        rpuPath = args.variables.user.rpu_path;
        workDir = (0, fileUtils_1.getPluginWorkDir)(args);
        fileName = (0, fileUtils_1.getFileName)(inputPath);
        rawHevcPath = "".concat(workDir, "/").concat(fileName, ".hevc");
        rawInjectedPath = "".concat(workDir, "/").concat(fileName, "_injected.hevc");
        if (!rpuPath) {
            throw new Error('No RPU path found in flow variables. Please use "Extract RPU" before this plugin.');
        }
        try {
            // 1. Extract raw HEVC bitstream from input (likely MKV)
            args.jobLog("Extracting raw HEVC bitstream from ".concat(inputPath));
            extraArgs = args.variables.ffmpegCommand.overallOuputArguments.join(' ');
            extractCmd = "\"".concat(ffmpegPath, "\" -i \"").concat(inputPath, "\" -map 0:v:0 -c:v copy ").concat(extraArgs, " \"").concat(rawHevcPath, "\" -y");
            args.jobLog("Running extraction command: ".concat(extractCmd));
            execSync(extractCmd);
            // 2. Inject RPU into raw HEVC
            args.jobLog("Injecting RPU from ".concat(rpuPath, " into ").concat(rawInjectedPath));
            injectCmd = "\"".concat(doviToolPath, "\" inject-rpu --input \"").concat(rawHevcPath, "\" --rpu-in \"").concat(rpuPath, "\" -o \"").concat(rawInjectedPath, "\"");
            execSync(injectCmd);
            // 3. Cleanup temp raw HEVC
            if (fs.existsSync(rawHevcPath)) {
                fs.unlinkSync(rawHevcPath);
            }
            args.jobLog('RPU injected successfully into raw bitstream');
        }
        catch (err) {
            args.jobLog("Error during RPU injection process: ".concat(err.message));
            throw new Error("RPU injection failed: ".concat(err.message));
        }
        return [2 /*return*/, {
                outputFileObj: {
                    _id: rawInjectedPath,
                },
                outputNumber: 1,
                variables: args.variables,
            }];
    });
}); };
exports.plugin = plugin;
