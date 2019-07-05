# Google Home Adapter

[![Build Status](https://travis-ci.org/tim-hellhake/google-home-adapter.svg?branch=master)](https://travis-ci.org/tim-hellhake/google-home-adapter)
[![dependencies](https://david-dm.org/tim-hellhake/google-home-adapter.svg)](https://david-dm.org/tim-hellhake/google-home-adapter)
[![devDependencies](https://david-dm.org/tim-hellhake/google-home-adapter/dev-status.svg)](https://david-dm.org/tim-hellhake/google-home-adapter?type=dev)
[![optionalDependencies](https://david-dm.org/tim-hellhake/google-home-adapter/optional-status.svg)](https://david-dm.org/tim-hellhake/google-home-adapter?type=optional)
[![license](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](LICENSE)

Uses your Google Home device to speak to you.

## Usage
The addon registers a google-home device with a `speak(text, language)` action.

For a list of possible language values see https://cloud.google.com/speech-to-text/docs/languages.

Currently, a rule can only trigger parameterless actions.

To read a text from a rule, you have to register an action with a predefined message.

Go to the settings of the addon and add a rule with a name and a message of your choice.

The google-home device now provides a new action with the specified name you can use in a rule.
