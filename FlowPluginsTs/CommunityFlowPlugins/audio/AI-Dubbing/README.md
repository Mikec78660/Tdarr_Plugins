# AI-Dubbing Plugin

This is a basic AI Dubbing plugin for Tdarr Flow. It serves as a template for creating more advanced dubbing functionality.

## Description

The AI-Dubbing plugin is a simple flow plugin that prints "DUBBING" to the output log when executed. This plugin demonstrates the basic structure of a Tdarr Flow plugin and can be extended to implement actual AI dubbing functionality.

## Features

- Single input and single output handle
- Logs "DUBBING" to the output
- Follows Tdarr Flow plugin conventions
- Easy to extend with additional functionality

## Usage

1. Add this plugin to your Tdarr Flow
2. Connect it to other plugins in your workflow
3. The plugin will log "DUBBING" to the output when executed

## Development

This plugin follows the standard Tdarr Flow plugin structure:
- One input handle
- One output handle
- Uses the standard Tdarr Flow plugin interfaces
- Implements the required `details()` and `plugin()` functions

## Future Enhancements

This plugin can be extended to:
- Integrate with AI dubbing APIs
- Process audio files for dubbing
- Handle different languages
- Implement quality control checks
