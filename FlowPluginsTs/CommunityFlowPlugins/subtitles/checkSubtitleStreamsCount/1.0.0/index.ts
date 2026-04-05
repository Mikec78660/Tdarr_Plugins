import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Check Subtitle Streams Count',
  description: 'This plugin checks if the number of subtitle streams is equal, less or more than a specific number.',
  style: {
    borderColor: 'orange',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [
    {
      label: 'Streams Count',
      name: 'subtitleStreamsTarget',
      type: 'number',
      defaultValue: '1',
      inputUI: {
        type: 'slider',
        sliderOptions: {
          min: 0,
          max: 10,
        },
      },
      tooltip: 'Specify streams count to check for',
    },

  ],
  outputs: [
    {
      number: 1,
      tooltip: 'The number of subtitle streams is equal',
    },
    {
      number: 2,
      tooltip: 'The number of subtitle streams is less',
    },
    {
      number: 3,
      tooltip: 'The number of subtitle streams is more',
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const { subtitleStreamsTarget } = args.inputs as { subtitleStreamsTarget: number; };
  const { ffProbeData } = args.inputFileObj;
  if (!ffProbeData || !ffProbeData.streams) {
    throw new Error('ffProbeData or ffProbeData.streams is not available.');
  }
  const { streams } = ffProbeData;
  if (!Array.isArray(streams)) {
    throw new Error('File has no valid stream data');
  }

  args.jobLog(`Checking for ${subtitleStreamsTarget} subtitle streams`);
  const subtitleStreamsCount = streams.reduce(
    (count, stream) => (stream.codec_type === 'subtitle' ? count + 1 : count),
    0,
  );
  args.jobLog(`${subtitleStreamsCount} subtitle streams found`);

  const getOutputNumber = (count: number, target: number): number => {
    if (count === target) return 1;
    if (count < target) return 2;
    return 3;
  };

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: getOutputNumber(subtitleStreamsCount, subtitleStreamsTarget),
    variables: args.variables,
  };
};
export {
  details,
  plugin,
};
