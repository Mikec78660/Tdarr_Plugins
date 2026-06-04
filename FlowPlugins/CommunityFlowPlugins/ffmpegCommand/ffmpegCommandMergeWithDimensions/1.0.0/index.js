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
    name: 'Merge with Display Dimensions',
    description: 'Merges video and audio while setting custom display dimensions using mkvmerge.',
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faObjectGroup',
    inputs: [
        {
            label: 'Mkvmerge Path',
            name: 'mkvmergePath',
            type: 'string',
            defaultValue: 'mkvmerge',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Path to the mkvmerge executable.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Merged successfully',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, execSync, mkvmergePath, inputPath, workVideoPath, workDir, fileName, outputPath, croppedWidth, croppedHeight, cmd;
    return __generator(this, function (_a) {
        lib = require('../../../../../methods/lib')();
        execSync = require('child_process').execSync;
        args.inputs = lib.loadDefaultValues(args.inputs, details);
        mkvmergePath = String(args.inputs.mkvmergePath);
        inputPath = args.originalLibraryFile._id;
        workVideoPath = args.inputFileObj._id;
        workDir = (0, fileUtils_1.getPluginWorkDir)(args);
        fileName = (0, fileUtils_1.getFileName)(inputPath);
        outputPath = "".concat(workDir, "/").concat(fileName, "_merged.mkv");
        croppedWidth = args.variables.user.cropped_width;
        croppedHeight = args.variables.user.cropped_height;
        if (!croppedWidth || !croppedHeight) {
            throw new Error('Cropped dimensions not found in flow variables. Please ensure the crop plugin is set up to provide these.');
        }
        args.jobLog("Merging files. Setting display dimensions to ".concat(croppedWidth, "x").concat(croppedHeight));
        cmd = "\"".concat(mkvmergePath, "\" -o \"").concat(outputPath, "\" --display-dimensions 0:").concat(croppedWidth, "x").concat(croppedHeight, " \"").concat(workVideoPath, "\" --no-video \"").concat(inputPath, "\"");
        args.jobLog("Running merge command: ".concat(cmd));
        try {
            execSync(cmd);
            args.jobLog('Merged successfully');
        }
        catch (err) {
            args.jobLog("Error merging files: ".concat(err.message));
            throw new Error("Merge failed: ".concat(err.message));
        }
        return [2 /*return*/, {
                outputFileObj: {
                    _id: outputPath,
                },
                outputNumber: 1,
                variables: args.variables,
            }];
    });
}); };
exports.plugin = plugin;
