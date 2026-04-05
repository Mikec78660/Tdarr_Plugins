import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Keep First N Subtitle Streams',
  description: 'Keeps only the first N subtitle streams and removes all others.',
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
      tooltip: 'Enter the number of subtitle streams to keep (starting from the first)',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  checkFfmpegCommandInit(args);

  const streamsToKeep = Number(args.inputs.streamsToKeep);

  // Get all subtitle streams from the file, preserving their original order
  const subtitleStreams = args.variables.ffmpegCommand.streams
    .filter((stream) => stream.codec_type === 'subtitle');

  args.jobLog(`Total subtitle streams found: ${subtitleStreams.length}`);
  args.jobLog(`Keeping first ${streamsToKeep} subtitle streams`);

  let keptCount = 0;
  let removedCount = 0;

  // Mark subtitle streams for removal if they are beyond the keep limit
  subtitleStreams.forEach((stream, index) => {
    if (index >= streamsToKeep) {
      if (!stream.removed) {
        stream.removed = true;
        removedCount += 1;
        args.jobLog(`Removing subtitle stream index ${stream.index} (position ${index + 1})`);
      }
    } else {
      keptCount += 1;
      args.jobLog(`Keeping subtitle stream index ${stream.index} (position ${index + 1})`);

      // Add copy codec to preserve original subtitle format
      if (!stream.outputArgs) {
        stream.outputArgs = [];
      }
      stream.outputArgs.push(`-c:${stream.index}`, 'copy');
      args.jobLog(`Setting copy codec for subtitle stream index ${stream.index}`);
    }
  });

  args.jobLog(`Kept ${keptCount} subtitle stream(s), removed ${removedCount} subtitle stream(s)`);

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
