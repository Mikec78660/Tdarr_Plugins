import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';

const details = (): IpluginDetails => ({
  name: 'Inject RPU (Dolby Vision)',
  description: 'Injects extracted RPU data back into a video using dovi_tool.',
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
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  const { execSync } = require('child_process');
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const doviToolPath = String(args.inputs.doviToolPath);
  const inputPath = args.inputFileObj._id;
  const rpuPath = args.variables.user.rpu_path;
  const workDir = getPluginWorkDir(args);
  const fileName = getFileName(inputPath);
  const outputPath = `${workDir}/${fileName}_injected.mkv`;

  if (!rpuPath) {
    throw new Error('No RPU path found in flow variables. Please use "Extract RPU" before this plugin.');
  }

  args.jobLog(`Injecting RPU from ${rpuPath} into ${outputPath}`);
  
  const cmd = `"${doviToolPath}" inject-rpu --input "${inputPath}" --rpu-in "${rpuPath}" -o "${outputPath}"`;
  
  try {
    execSync(cmd);
    args.jobLog('RPU injected successfully');
  } catch (err: any) {
    args.jobLog(`Error injecting RPU: ${err.message}`);
    throw new Error(`RPU injection failed: ${err.message}`);
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
