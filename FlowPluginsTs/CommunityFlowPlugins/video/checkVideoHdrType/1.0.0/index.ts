import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Check Video HDR Type',
  description: 'Checks if the video has Dolby Vision, HDR10+, or neither.',
  style: {
    borderColor: 'orange',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'Dolby Vision detected',
    },
    {
      number: 2,
      tooltip: 'HDR10+ detected',
    },
    {
      number: 3,
      tooltip: 'Neither Dolby Vision nor HDR10+ detected',
    },
  ],
});

const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  let isDovi = false;
  let isHdr10Plus = false;

  if (args.inputFileObj.ffProbeData.streams) {
    args.inputFileObj.ffProbeData.streams.forEach((stream: any) => {
      if (stream.codec_type === 'video') {
        // Check for Dolby Vision in side data
        if (stream.side_data_list) {
          stream.side_data_list.forEach((sideData: any) => {
            if (sideData.side_data_type === 'DOVI configuration record') {
              isDovi = true;
            }
            if (sideData.side_data_type === 'HDR10+ dynamic metadata') {
              isHdr10Plus = true;
            }
          });
        }
        
        // Check for HDR10+ in metadata
        if (stream.metadata) {
          const metadataStr = JSON.stringify(stream.metadata).toLowerCase();
          if (metadataStr.includes('hdr10plus') || metadataStr.includes('hdr10+')) {
            isHdr10Plus = true;
          }
        }

        // Additional check for DOVI in codec_tag_string or other fields
        if (stream.codec_tag_string === 'dvc1' || stream.codec_tag_string === 'dvhe') {
          isDovi = true;
        }
      }
    });
  }

  if (isDovi) {
    args.jobLog('Dolby Vision detected');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  if (isHdr10Plus) {
    args.jobLog('HDR10+ detected');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }

  args.jobLog('Neither Dolby Vision nor HDR10+ detected');
  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 3,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
