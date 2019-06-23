/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const {
  Adapter,
  Device,
} = require('gateway-addon');

const {
  Scanner
} = require('google-home-notify-client');

class GoogleHomeDevice extends Device {
  constructor(adapter, manifest, device) {
    super(adapter, `google-home-${device.ip}`);
    this['@context'] = 'https://iot.mozilla.org/schemas/';
    this.name = `${manifest.display_name} (${device.ip})`;
    this.description = manifest.description;
    this.config = manifest.moziot.config;
    this.device = device;

    const speakInput = {
      type: 'object',
      properties: {
        text: {
          type: 'string'
        }
      }
    };

    this.addSpeakAction('speak', speakInput);

    this.messages = {};

    if (this.config.messages) {
      for (const message of this.config.messages) {
        this.messages[message.name] = message.message;
        console.log(`Creating action for ${message.name}`);
        this.addSpeakAction(message.name);
      }
    }
  }

  addSpeakAction(name, input) {
    const description = {
      title: name,
      description: 'Read some text',
    };

    if (input) {
      description.input = input;
    }

    this.addAction(name, description);
  }

  async performAction(action) {
    action.start();

    if (action.name === 'speak') {
      console.log(`Speaking ${action.input.text}`);
      this.device.notify(action.input.text);
    } else {
      const message = this.messages[action.name];

      if (message) {
        console.log(`Speaking ${message}`);
        this.device.notify(message);
      } else {
        console.warn(`Unknown action ${action}`);
      }
    }

    action.finish();
  }
}

class GoogleHomeAdapter extends Adapter {
  constructor(addonManager, manifest) {
    super(addonManager, GoogleHomeAdapter.name, manifest.name);
    addonManager.addAdapter(this);

    Scanner.scan((device) => {
      if (device.name && device.name.indexOf('_googlecast._tcp.local') > -1) {
        console.log(`Detected Google Home at ${device.ip}`);
        const googleHomeDevice = new GoogleHomeDevice(this, manifest, device);
        this.handleDeviceAdded(googleHomeDevice);
      }
    });
  }
}

module.exports = GoogleHomeAdapter;
