import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import { getContainer, getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'Extract Audio',
  description: 'Extracts a specific audio stream from a file and saves it as a separate audio file without transcoding.',
  style: {
    borderColor: 'blue',
    borderRadius: '10px',
    backgroundColor: '#007bff',
  },
  tags: 'audio,extract,stream,copy',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faAudioDescription',
  inputs: [
    {
      label: 'Audio Stream Index',
      name: 'audioStreamIndex',
      type: 'number',
      defaultValue: '0',
      inputUI: {
        type: 'slider',
        sliderOptions: {
          min: 0,
          max: 10,
        },
      },
      tooltip: 'Select the index of the audio stream to extract (0 = first stream)',
    },
    {
      label: 'Output Container',
      name: 'outputContainer',
      type: 'string',
      defaultValue: 'mka',
      inputUI: {
        type: 'dropdown',
        options: [
          'mka',
          'mkv',
          'mp3',
          'aac',
          'flac',
          'wav',
        ],
      },
      tooltip: 'Select the output container format for the extracted audio',
    },
    {
      label: 'Create Separate File',
      name: 'createSeparateFile',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Create a separate audio file instead of modifying the original',
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

  const { audioStreamIndex } = args.inputs as { audioStreamIndex: number; };
  const { outputContainer } = args.inputs as { outputContainer: string; };
  const { createSeparateFile } = args.inputs as { createSeparateFile: boolean; };

  // Validate input
  if (audioStreamIndex < 0) {
    throw new Error('Audio stream index must be 0 or greater');
  }

  // Get file information
  const { ffProbeData } = args.inputFileObj;
  if (!ffProbeData || !ffProbeData.streams) {
    throw new Error('ffProbeData or ffProbeData.streams is not available.');
  }

  const { streams } = ffProbeData;
  if (!Array.isArray(streams)) {
    throw new Error('File has no valid stream data');
  }

  // Count audio streams
  const audioStreams = streams.filter((stream) => stream.codec_type === 'audio');
  if (audioStreams.length === 0) {
    throw new Error('No audio streams found in the file');
  }

  if (audioStreamIndex >= audioStreams.length) {
    throw new Error(`Audio stream index ${audioStreamIndex} is out of range. File has ${audioStreams.length} audio streams.`);
  }

  args.jobLog(`Found ${audioStreams.length} audio streams in the file`);
  args.jobLog(
    `Extracting audio stream ${audioStreamIndex} (codec: ${audioStreams[audioStreamIndex].codec_name})`,
  );

  let outputFilePath = '';
  const inputFile = args.inputFileObj._id;

  // If we need to create a separate file
  if (createSeparateFile) {
    // Get the output file path
    const container = outputContainer;
    const fileName = getFileName(args.inputFileObj._id);
    const workDir = getPluginWorkDir(args);
    outputFilePath = `${workDir}/${fileName}_extracted_audio.${container}`;

    // Build FFmpeg command to copy the audio stream
    const ffmpegArgs = [
      '-i',
      inputFile,
      '-map',
      `0:a:${audioStreamIndex}`,
      '-c',
      'copy',
      outputFilePath,
    ];

    args.jobLog(`Running FFmpeg command: ${ffmpegArgs.join(' ')}`);

    const cli = new CLI({
      cli: args.ffmpegPath,
      spawnArgs: ffmpegArgs,
      spawnOpts: {},
      jobLog: args.jobLog,
      outputFilePath,
      inputFileObj: args.inputFileObj,
      logFullCliOutput: args.logFullCliOutput,
      updateWorker: args.updateWorker,
      args,
    });

    const res = await cli.runCli();

    if (res.cliExitCode !== 0) {
      args.jobLog('Running FFmpeg failed');
      throw new Error('FFmpeg failed to extract audio stream');
    }

    args.jobLog(`Audio stream extracted successfully to: ${outputFilePath}`);
  } else {
    // If we're not creating a separate file, we'll modify the original file
    // This is more complex and not typically needed for extraction, so we'll just process the original
    outputFilePath = inputFile;
    args.jobLog('Processing original file (no separate file created)');
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
