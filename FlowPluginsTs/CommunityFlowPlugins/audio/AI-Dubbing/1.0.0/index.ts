import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const details = (): IpluginDetails => ({
  name: 'AI-Dubbing',
  nameUI: {
    type: 'text',
    style: {
      height: '50px',
    },
  },
  description: 'AI Dubbing plugin for Tdarr Flow. Transcribes, translates, and synthesizes speech using configurable APIs.',
  style: {
    borderColor: 'orange',
    borderRadius: '10px',
    backgroundColor: '#ff9900',
  },
  tags: 'ai,dubbing,translation,speech,synthesis',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faMicrophone',
  inputs: [
    {
      label: 'API Endpoint URL',
      name: 'apiEndpoint',
      type: 'string',
      defaultValue: 'https://api.speaches.ai',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Enter the base URL of the Speaches API endpoint (e.g., https://api.speaches.ai)',
    },
    {
      label: 'Target Language',
      name: 'targetLanguage',
      type: 'string',
      defaultValue: 'en',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Enter the target language code for translation (e.g., en, es, fr)',
    },
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
      tooltip: 'Select the index of the audio stream to process (0 = first stream)',
    },
    {
      label: 'Enable Debug Logging',
      name: 'debugLogging',
      type: 'boolean',
      defaultValue: 'false',
      inputUI: {
        type: 'switch',
      },
      tooltip: 'Enable detailed logging for debugging purposes',
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
  const lib = require('../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  const {
    apiEndpoint, targetLanguage, audioStreamIndex, debugLogging,
  } = args.inputs as {
    apiEndpoint: string;
    targetLanguage: string;
    audioStreamIndex: number;
    debugLogging: boolean;
  };

  if (debugLogging) {
    args.jobLog(`AI-Dubbing plugin started with API endpoint: ${apiEndpoint}`);
    args.jobLog(`Target language: ${targetLanguage}`);
    args.jobLog(`Audio stream index: ${audioStreamIndex}`);
  }

  try {
    // Validate inputs
    if (!apiEndpoint) {
      throw new Error('API endpoint URL is required');
    }

    if (!targetLanguage) {
      throw new Error('Target language is required');
    }

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

    if (debugLogging) {
      args.jobLog(`Found ${audioStreams.length} audio streams in the file`);
      args.jobLog(`Processing audio stream ${audioStreamIndex} (codec: ${audioStreams[audioStreamIndex].codec_name})`);
    }

    // Step 1: Extract audio stream to temporary file
    const inputFile = args.inputFileObj._id;
    const workDir = getPluginWorkDir(args);
    const fileName = getFileName(inputFile);
    const audioFilePath = `${workDir}/${fileName}_temp_audio.aac`;

    // Build FFmpeg command to extract audio stream
    const ffmpegArgs = [
      '-i',
      inputFile,
      '-map',
      `0:a:${audioStreamIndex}`,
      '-c',
      'copy',
      audioFilePath,
    ];

    if (debugLogging) {
      args.jobLog(`Extracting audio stream with FFmpeg command: ${ffmpegArgs.join(' ')}`);
    }

    const { CLI } = require('../../../../FlowHelpers/1.0.0/cliUtils');
    const cli = new CLI({
      cli: args.ffmpegPath,
      spawnArgs: ffmpegArgs,
      spawnOpts: {},
      jobLog: args.jobLog,
      outputFilePath: audioFilePath,
      inputFileObj: args.inputFileObj,
      logFullCliOutput: args.logFullCliOutput,
      updateWorker: args.updateWorker,
      args,
    });

    const res = await cli.runCli();

    if (res.cliExitCode !== 0) {
      throw new Error('FFmpeg failed to extract audio stream');
    }

    if (debugLogging) {
      args.jobLog(`Audio stream extracted successfully to: ${audioFilePath}`);
    }

    // Step 2: Transcribe audio to text using Speaches API
    let transcription = '';
    const transcribeUrl = `${apiEndpoint}/v1/audio/transcriptions`;

    if (debugLogging) {
      args.jobLog(`Transcribing audio to text using API: ${transcribeUrl}`);
    }

    // Make HTTP request to Speaches API for transcription
    const axios = require('axios');
    const transcribeResponse = await axios.post(transcribeUrl, {
      file: audioFilePath,
      language: targetLanguage,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    transcription = transcribeResponse.data.text || '';
    
    if (debugLogging) {
      args.jobLog(`Transcription result: ${transcription}`);
    }

    // Step 3: Translate text to target language using Speaches API
    let translatedText = '';
    if (debugLogging) {
      args.jobLog(`Translating text to target language: ${targetLanguage}`);
    }

    // Make HTTP request to Speaches API for translation
    const translateUrl = `${apiEndpoint}/v1/audio/translate`;
    const translateResponse = await axios.post(translateUrl, {
      text: transcription,
      target_language: targetLanguage,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    translatedText = translateResponse.data.text || '';
    
    if (debugLogging) {
      args.jobLog(`Translated text: ${translatedText}`);
    }

    // Step 4: Convert translated text to speech using Speaches API
    const speechUrl = `${apiEndpoint}/v1/audio/speech`;

    if (debugLogging) {
      args.jobLog(`Converting text to speech using API: ${speechUrl}`);
    }

    // Make HTTP request to Speaches API for speech synthesis
    const speechResponse = await axios.post(speechUrl, {
      text: translatedText,
      language: targetLanguage,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer', // Important for getting audio data
    });

    // Save the synthesized audio
    const synthesizedAudioPath = `${workDir}/${fileName}_synthesized_audio.wav`;
    const fs = require('fs');
    fs.writeFileSync(synthesizedAudioPath, speechResponse.data, 'binary');
    
    if (debugLogging) {
      args.jobLog(`Synthesized audio saved to: ${synthesizedAudioPath}`);
    }

    // Step 5: Mux the new audio file back into the video file as the last audio stream
    if (debugLogging) {
      args.jobLog('Muxing synthesized audio back into video file as the last audio stream');
    }

    // Build FFmpeg command to remux with new audio stream as last stream
    const outputFilePath = `${workDir}/${fileName}_dubbed.${getFileName(inputFile).split('.').pop()}`;
    
    const remuxArgs = [
      '-i',
      inputFile,
      '-i',
      synthesizedAudioPath,
      '-c',
      'copy',
      '-map',
      '0:v:0',           // Copy video stream from original
      '-map',
      '0:a:0',           // Copy first audio stream from original (if exists)
      '-map',
      '1:a:0',           // Add new audio stream as last audio stream
      '-y',              // Overwrite output file
      outputFilePath,
    ];

    if (debugLogging) {
      args.jobLog(`Remuxing video with new audio using FFmpeg command: ${remuxArgs.join(' ')}`);
    }

    const remuxCli = new CLI({
      cli: args.ffmpegPath,
      spawnArgs: remuxArgs,
      spawnOpts: {},
      jobLog: args.jobLog,
      outputFilePath,
      inputFileObj: args.inputFileObj,
      logFullCliOutput: args.logFullCliOutput,
      updateWorker: args.updateWorker,
      args,
    });

    const remuxRes = await remuxCli.runCli();

    if (remuxRes.cliExitCode !== 0) {
      throw new Error('FFmpeg failed to remux video with new audio');
    }

    if (debugLogging) {
      args.jobLog(`Video file with new audio stream successfully created: ${outputFilePath}`);
    }

    // Return success with the new file
    return {
      outputFileObj: {
        _id: outputFilePath,
      },
      outputNumber: 1,
      variables: args.variables,
    };
  } catch (error) {
    args.jobLog(`AI-Dubbing plugin failed: ${(error as Error).message}`);
    throw error;
  }
};
export {
  details,
  plugin,
};
