import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';

const details = (): IpluginDetails => ({
  name: 'Crop Black Bars h264 Metadata',
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
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  const { execSync } = require('child_process');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  checkFfmpegCommandInit(args);

  const threshold = Number(args.inputs.threshold);
  const { ffmpegPath } = args;
  const path = args.inputFileObj._id;

  const runCropDetect = (ss: number): string[] => {
    // Run ffmpeg with cropdetect for 100 frames starting at ss
    const cmd = `"${ffmpegPath}" -ss ${ss} -i "${path}" -vframes 100 -vf cropdetect -f null - 2>&1`;
    try {
      const output = execSync(cmd).toString();
      const lines = output.split('\n');
      const crops: string[] = [];
      lines.forEach((line: string) => {
        if (line.includes('crop=')) {
          // Extract the crop=w:h:x:y part
          const match = line.match(/crop=([0-9]+:[0-9]+:[0-9]+:[0-9]+)/);
          if (match) {
            crops.push(match[1]);
          }
        }
      });
      return crops;
    } catch (e: any) {
      args.jobLog(`Error running cropdetect: ${e.message}`);
      return [];
    }
  };

  args.jobLog('Running cropdetect at 300s...');
  const crops300 = runCropDetect(300);
  args.jobLog('Running cropdetect at 600s...');
  const crops600 = runCropDetect(600);

  const allCrops = crops300.concat(crops600);

  if (allCrops.length === 0) {
    args.jobLog('No crop detected.');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  // Check if all lines give an equal crop value
  const firstCrop = allCrops[0];
  const allEqual = allCrops.every((c) => c === firstCrop);

  if (!allEqual) {
    args.jobLog('Inconsistent crop values detected across lines.');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 3,
      variables: args.variables,
    };
  }

  // If consistent, parse values: w:h:x:y
  const parts = firstCrop.split(':');
  const w = parts[0];
  const h = parts[1];
  const y = parseInt(parts[3], 10);

  args.variables.user.cropped_width = w;
  args.variables.user.cropped_height = h;

  args.jobLog(`Detected consistent crop: ${firstCrop} (y=${y}). Setting flow variables: ${w}x${h}`);

  if (y <= threshold) {
    args.jobLog(`Crop y (${y}) is below or equal to threshold (${threshold}). Skipping crop.`);
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
  args.variables.ffmpegCommand.overallOuputArguments.push(
    '-bsf:v', `h264_metadata=crop_top=${y}:crop_bottom=${y}`,
  );
  args.variables.ffmpegCommand.shouldProcess = true;

  args.jobLog(`Added H264 metadata crop arguments: crop_top=${y}, crop_bottom=${y}`);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 2,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
