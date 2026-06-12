import {
  getContainer, getFileName, getSubStem,
} from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import normJoinPath from '../../../../FlowHelpers/1.0.0/normJoinPath';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Move To Directory (Atomic)',
  description: 'Move working file to directory using an atomic rename (true move). Prevents double space by failing or warning if a copy would be required.',
  style: {
    borderColor: 'green',
  },
  tags: 'file',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faArrowRight',
  inputs: [
    {
      label: 'Output Directory',
      name: 'outputDirectory',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'directory',
      },
      tooltip: 'Specify output directory',
    },
    {
      label: 'Keep Relative Path',
      name: 'keepRelativePath',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: `
Specify whether to keep the relative path.

For example:

\\n Source folder:
\\n C:/input/

\\n Source file:
\\n C:/input/test1/test2/qsv_h264.mkv

\\n Move to Directory Output Directory
\\n C:/output/

\\n Keep Relative Path disabled:
\\n C:/output/qsv_h264.mkv

\\n Keep Relative Path enabled:
\\n C:/output/test1/test2/qsv_h264.mkv
      `,
    },
    {
      label: 'Allow Copy Fallback',
      name: 'allowCopyFallback',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'If a true move (rename) is not possible (e.g. across drives/mounts), allow falling back to a copy-and-delete operation. If disabled, the plugin will fail, ensuring no "double space" is used during the transition.',
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
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const {
    keepRelativePath,
    allowCopyFallback,
  } = args.inputs;

  const outputDirectory = String(args.inputs.outputDirectory);

  const originalFileName = getFileName(args.inputFileObj._id);
  const newContainer = getContainer(args.inputFileObj._id);

  let outputPath = '';

  if (keepRelativePath) {
    const subStem = getSubStem({
      inputPathStem: args.librarySettings.folder,
      inputPath: args.originalLibraryFile._id,
    });

    outputPath = normJoinPath({
      upath: args.deps.upath,
      paths: [
        outputDirectory,
        subStem,
      ],
    });
  } else {
    outputPath = outputDirectory;
  }

  const outputFilePath = normJoinPath({
    upath: args.deps.upath,
    paths: [
      outputPath,
      `${originalFileName}.${newContainer}`,
    ],
  });

  args.jobLog(`Input path: ${args.inputFileObj._id}`);
  args.jobLog(`Output path: ${outputFilePath}`);

  if (args.inputFileObj._id === outputFilePath) {
    args.jobLog('Input and output path are the same, skipping move.');

    return {
      outputFileObj: {
        _id: args.inputFileObj._id,
      },
      outputNumber: 1,
      variables: args.variables,
    };
  }

  args.deps.fsextra.ensureDirSync(outputPath);

  const fs = require('fs').promises;

  try {
    args.jobLog('Attempting atomic rename...');
    await fs.rename(args.inputFileObj._id, outputFilePath);
    args.jobLog('Move completed successfully (atomic).');
  } catch (err: any) {
    args.jobLog(`Atomic rename failed: ${err.message}`);

    if (err.code === 'EXDEV' || err.message.toLowerCase().includes('cross-device')) {
      if (!allowCopyFallback) {
        throw new Error('True move failed (cross-device) and Copy Fallback is disabled. Atomic move only works within the same filesystem/mount.');
      }
      
      args.jobLog('Cross-device move detected. Falling back to copy (this will use double space during the process).');
      
      const fileMoveOrCopy = require('../../../../FlowHelpers/1.0.0/fileMoveOrCopy').default;
      await fileMoveOrCopy({
        operation: 'move',
        sourcePath: args.inputFileObj._id,
        destinationPath: outputFilePath,
        args,
      });
    } else {
      args.jobLog('Trying fallback shell move (some systems handle this better)...');
      try {
          const { execSync } = require('child_process');
          // Standard mv command
          execSync(`mv "${args.inputFileObj._id}" "${outputFilePath}"`);
          args.jobLog('Shell move completed successfully.');
      } catch (shellErr: any) {
          args.jobLog(`Shell move also failed: ${shellErr.message}`);
          throw err; // throw original error
      }
    }
  }

  return {
    outputFileObj: {
      _id: outputFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
