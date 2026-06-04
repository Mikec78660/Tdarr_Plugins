import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';

const details = (): IpluginDetails => ({
  name: 'Extract RPU (Dolby Vision)',
  description: 'Extracts RPU data from a Dolby Vision video using dovi_tool.',
  style: {
    borderColor: '#6efefc',
  },
  tags: 'video',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faDownload',
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
      tooltip: 'RPU extracted successfully',
    },
  ],
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  const { execSync } = require('child_process');
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const doviToolPath = String(args.inputs.doviToolPath);
  const inputPath = args.inputFileObj._id;
  const workDir = getPluginWorkDir(args);
  const rpuOutputPath = `${workDir}/safe_RPU.bin`;

  args.jobLog(`Extracting RPU to ${rpuOutputPath}`);
  
  const cmd = `"${doviToolPath}" -c extract-rpu "${inputPath}" -o "${rpuOutputPath}"`;
  
  try {
    execSync(cmd);
    args.variables.user.rpu_path = rpuOutputPath;
    args.jobLog('RPU extracted successfully');
  } catch (err: any) {
    args.jobLog(`Error extracting RPU: ${err.message}`);
    throw new Error(`RPU extraction failed: ${err.message}`);
  }

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
