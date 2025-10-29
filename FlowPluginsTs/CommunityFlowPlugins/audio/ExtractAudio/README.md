# Extract Audio Plugin

This is an Extract Audio plugin for Tdarr Flow. It extracts a specific audio stream from a file and saves it as a separate audio file without transcoding.

## Description

The Extract Audio plugin allows you to:
- Select which audio stream to extract from a file (by index)
- Save the extracted audio as a separate file in various container formats
- Copy the audio stream without any transcoding (preserving original quality)
- Choose between creating a separate file or processing the original file

## Features

- **Stream Selection**: Choose which audio stream to extract (0 = first stream)
- **Format Support**: Extract to various audio formats (mka, mkv, mp3, aac, flac, wav)
- **No Transcoding**: Copies audio streams without re-encoding for maximum quality preservation
- **Configurable**: Easy to configure through the Tdarr flow interface

## Usage

1. Add this plugin to your Tdarr Flow
2. Configure the audio stream index to extract
3. Select the output container format
4. Choose whether to create a separate file
5. Connect to other plugins in your workflow

## Inputs

- **Audio Stream Index**: The index of the audio stream to extract (0 = first stream)
- **Output Container**: The container format for the extracted audio file
- **Create Separate File**: Whether to create a separate file (recommended)

## Example Workflow

```
Input File → Extract Audio → Process Audio → Output
```

This plugin is useful for:
- Creating backup copies of specific audio tracks
- Isolating audio streams for further processing
- Extracting audio from multi-language files
- Creating separate audio files for different languages or qualities

## Technical Details

The plugin uses FFmpeg's `-c copy` option to copy audio streams without re-encoding, ensuring that the extracted audio maintains the exact same quality as the original stream.
