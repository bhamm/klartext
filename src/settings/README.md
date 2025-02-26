# Settings Architecture

This directory contains the code for the Klartext extension's settings UI. The settings interface has been refactored to follow a modular architecture with clear separation of concerns.

## Directory Structure

```
src/settings/
├── components/           # UI component modules
│   ├── provider-selector.js  # Provider selection and API configuration
│   └── settings-panel.js     # Text size and experimental features settings
├── services/             # Business logic and services
│   ├── settings-service.js   # Loading/saving settings
│   └── validation-service.js # Input validation
├── models/               # Data models and types
│   └── settings.js           # Settings data structure and validation
├── constants/            # Constants and configuration
│   └── providers.js          # Provider configurations
├── utils/                # Utility functions
│   └── dom-utils.js          # DOM manipulation helpers
├── settings.html         # Main HTML file
└── index.js              # Main entry point
```

## Architecture Overview

The settings interface follows a component-based architecture where each UI component is self-contained with its own initialization, event handling, and state management. The components communicate with each other through well-defined interfaces.

### Main Components

1. **Provider Selector**: Handles the selection of AI providers, models, and API configuration.
2. **Settings Panel**: Manages text size settings and experimental features.

### Services

1. **Settings Service**: Handles loading and saving settings to Chrome storage.
2. **Validation Service**: Validates user inputs and provides error messages.

### Models

1. **Settings Model**: Defines the structure of settings data and provides validation functions.

### Constants

1. **Providers**: Contains configuration for different AI providers.

### Utils

1. **DOM Utils**: Provides helper functions for DOM manipulation.

## Flow

1. The `index.js` file initializes the components and services.
2. Components register event listeners for user interactions.
3. When settings are saved, the settings service updates Chrome storage and notifies the background script.
4. Validation is performed before saving to ensure data integrity.

## Adding New Features

To add new features to the settings interface:

1. If it's a UI component, add a new file in the `components/` directory.
2. If it's a service, add a new file in the `services/` directory.
3. If it requires new data structures, add them to the `models/` directory.
4. Update the `index.js` file to initialize and wire up the new components.

## Best Practices

- Keep components small and focused on a single responsibility.
- Use services for business logic and data manipulation.
- Use models for data structure and validation.
- Use constants for configuration data.
- Use utils for reusable helper functions.
- Document your code with JSDoc comments.
