import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Remove Stream By Property',
  description: 'Remove Stream By Property',
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
      label: 'Codec Type',
      name: 'codecType',
      type: 'string',
      defaultValue: 'any',
      inputUI: {
        type: 'dropdown',
        options: [
          'audio',
          'video',
          'subtitle',
          'any',
        ],
      },
      tooltip:
        `
      Stream Codec Type to check against the property.
        `,
    },

    {
      label: 'Property To Check',
      name: 'propertyToCheck',
      type: 'string',
      defaultValue: 'codec_name',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `
        Enter one stream property to check.
        
        \\nExample:\\n
        codec_name

        \\nExample:\\n
        tags.language
        `,
    },
    {
      label: 'Values To Remove',
      name: 'valuesToRemove',
      type: 'string',
      defaultValue: 'aac',
      inputUI: {
        type: 'text',
      },
      tooltip:
        `
        Enter values of the property above to remove. For example, if removing by codec_name, could enter ac3,aac:
        
        \\nExample:\\n
        ac3,aac
        `,
    },
    {
      label: 'Condition',
      name: 'condition',
      type: 'string',
      defaultValue: 'includes',
      inputUI: {
        type: 'dropdown',
        options: [
          'includes',
          'not_includes',
        ],
      },
      tooltip: `
      Specify whether to remove streams that include or do not include the values above.
      `,
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

  const codecType = String(args.inputs.codecType).trim();
  const propertyToCheck = String(args.inputs.propertyToCheck).trim();
  const valuesToRemove = String(args.inputs.valuesToRemove).trim().split(',').map((item) => item.trim());
  const condition = String(args.inputs.condition);

  args.variables.ffmpegCommand.streams
    .filter((stream) => codecType === 'any' || stream.codec_type === codecType)
    .forEach((stream) => {
      let target = '';
      if (propertyToCheck.includes('.')) {
        const parts = propertyToCheck.split('.');
        target = stream[parts[0]]?.[parts[1]];
      } else {
        target = stream[propertyToCheck];
      }

      if (!target) {
        return;
      }

      const prop = String(target).toLowerCase();
      // For includes:      remove if the property includes ANY of the values
      // For not_includes:  remove if the property includes NONE of the values
      const shouldRemove = condition === 'includes'
        ? valuesToRemove.some((val) => prop.includes(val.toLowerCase()))
        : !valuesToRemove.some((val) => prop.includes(val.toLowerCase()));

      const valuesStr = valuesToRemove.join(', ');
      const action = shouldRemove ? 'Removing' : 'Keep';
      // eslint-disable-next-line max-len
      args.jobLog(`${action} stream index ${stream.index} because ${propertyToCheck} of ${prop} ${condition} ${valuesStr}\n`);
      if (shouldRemove) {
        // eslint-disable-next-line no-param-reassign
        stream.removed = true;
      } else {
        // Add copy codec to preserve original format for streams that are kept
        if (!stream.outputArgs) {
          stream.outputArgs = [];
        }

        // Remove any existing codec args for this stream index to avoid duplicates
        const streamIndexArg = `-c:${stream.index}`;
        stream.outputArgs = stream.outputArgs.filter((arg, i) => {
          // Remove this arg and the next arg (the codec value) if it's a codec setting
          if (arg === streamIndexArg && i + 1 < stream.outputArgs.length) {
            const nextArg = stream.outputArgs[i + 1];
            // Skip if it's another stream index arg or codec arg
            if (!nextArg.startsWith('-c:') && nextArg !== 'copy') {
              return false;
            }
          }
          return true;
        });

        stream.outputArgs.push(`-c:${stream.index}`, 'copy');
        args.jobLog(`Setting copy codec for stream index ${stream.index}`);
      }
    });

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
