import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';

const details = (): IpluginDetails => ({
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
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  const { execSync } = require('child_process');
  const fs = require('fs');
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const doviToolPath = String(args.inputs.doviToolPath);
  const { ffmpegPath } = args;
  const inputPath = args.inputFileObj._id;
  const rpuPath = args.variables.user.rpu_path;
  const workDir = getPluginWorkDir(args);
  const fileName = getFileName(inputPath);
  
  const rawHevcPath = `${workDir}/${fileName}.hevc`;
  const rawInjectedPath = `${workDir}/${fileName}_injected.hevc`;

  if (!rpuPath) {
    throw new Error('No RPU path found in flow variables. Please use "Extract RPU" before this plugin.');
  }

  try {
    // 1. Extract raw HEVC bitstream from input (likely MKV)
    args.jobLog(`Extracting raw HEVC bitstream from ${inputPath}`);
    const extractCmd = `"${ffmpegPath}" -i "${inputPath}" -c:v copy -bsf:v hevc_mp4toannexb -f hevc "${rawHevcPath}" -y`;
    execSync(extractCmd);

    // 2. Inject RPU into raw HEVC
    args.jobLog(`Injecting RPU from ${rpuPath} into ${rawInjectedPath}`);
    const injectCmd = `"${doviToolPath}" inject-rpu --input "${rawHevcPath}" --rpu-in "${rpuPath}" -o "${rawInjectedPath}"`;
    execSync(injectCmd);

    // 3. Cleanup temp raw HEVC
    if (fs.existsSync(rawHevcPath)) {
      fs.unlinkSync(rawHevcPath);
    }

    args.jobLog('RPU injected successfully into raw bitstream');
  } catch (err: any) {
    args.jobLog(`Error during RPU injection process: ${err.message}`);
    throw new Error(`RPU injection failed: ${err.message}`);
  }

  return {
    outputFileObj: {
        _id: rawInjectedPath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
