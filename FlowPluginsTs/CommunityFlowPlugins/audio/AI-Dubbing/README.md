# AI-Dubbing Plugin

This is an AI Dubbing plugin for Tdarr Flow that transcribes, translates, and synthesizes speech using configurable APIs.

## Description

The AI-Dubbing plugin processes audio streams from video files, transcribing them to text, translating the text to a target language, and then converting the translated text back to speech using configurable APIs. This plugin demonstrates advanced AI dubbing functionality that can work with various speech-to-text and text-to-speech APIs.

## Features

- Configurable API endpoint (supports custom endpoints like http://speaches.lan:8000)
- Language translation support
- Audio stream extraction from videos
- Integration with FFmpeg for audio processing
- Detailed logging for debugging
- Error handling and validation

## Usage

1. Add this plugin to your Tdarr Flow
2. Connect it to other plugins in your workflow
3. Configure the following options:
   - API Endpoint URL: Base URL of the API endpoint (e.g., http://speaches.lan:8000)
   - Target Language: Language code for translation (e.g., en, es, fr)
   - Audio Stream Index: Index of the audio stream to process (0 = first stream)
   - Enable Debug Logging: Enable detailed logging for debugging purposes

## Configuration Options

- **API Endpoint URL**: Enter the base URL of the API endpoint (e.g., http://speaches.lan:8000)
- **Target Language**: Enter the target language code for translation (e.g., en, es, fr)
- **Audio Stream Index**: Select the index of the audio stream to process (0 = first stream)
- **Enable Debug Logging**: Enable detailed logging for debugging purposes

## Workflow

1. Extract audio stream from the input video file
2. Transcribe audio to text using the configured API endpoint
3. Translate text to the target language
4. Convert translated text to speech using the configured API endpoint
5. Combine original video with new audio (implementation pending)

## Development

This plugin follows the standard Tdarr Flow plugin structure:
- One input handle
- One output handle
- Uses the standard Tdarr Flow plugin interfaces
- Implements the required `details()` and `plugin()` functions
- Integrates with FFmpeg for audio processing

## API Integration

The plugin is designed to work with APIs that support:
- `/v1/audio/transcriptions` endpoint for speech-to-text conversion
- `/v1/audio/speech` endpoint for text-to-speech conversion

The plugin automatically appends these endpoints to the configured base URL.

## Future Enhancements

This plugin can be extended to:
- Implement full API integration for transcription, translation, and speech synthesis
- Support additional API endpoints and formats
- Add quality control checks
- Implement more sophisticated audio processing
- Add support for multiple audio streams
- Include error recovery mechanisms
