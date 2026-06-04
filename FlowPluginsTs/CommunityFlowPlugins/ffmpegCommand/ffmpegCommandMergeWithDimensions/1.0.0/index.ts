import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';

const details = (): IpluginDetails => ({
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
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  const { execSync } = require('child_process');
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const mkvmergePath = String(args.inputs.mkvmergePath);
  const inputPath = args.originalLibraryFile._id; // Original file for audio/subs
  const workVideoPath = args.inputFileObj._id; // New video file
  const workDir = getPluginWorkDir(args);
  const fileName = getFileName(inputPath);
  const outputPath = `${workDir}/${fileName}_merged.mkv`;

  const croppedWidth = args.variables.user.cropped_width;
  const croppedHeight = args.variables.user.cropped_height;

  if (!croppedWidth || !croppedHeight) {
    throw new Error('Cropped dimensions not found in flow variables. Please ensure the crop plugin is set up to provide these.');
  }

  args.jobLog(`Merging files. Setting display dimensions to ${croppedWidth}x${croppedHeight}`);
  
  // mkvmerge -o "final output file" --display-dimensions 0:3840x1600 output-file --no-video "input.mkv"
  const cmd = `"${mkvmergePath}" -o "${outputPath}" --display-dimensions 0:${croppedWidth}x${croppedHeight} "${workVideoPath}" --no-video "${inputPath}"`;
  
  try {
    execSync(cmd);
    args.jobLog('Merged successfully');
  } catch (err: any) {
    args.jobLog(`Error merging files: ${err.message}`);
    throw new Error(`Merge failed: ${err.message}`);
  }

  return {
    outputFileObj: {
        _id: outputPath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
