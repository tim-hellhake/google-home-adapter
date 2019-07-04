/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Adapter, Device, } from 'gateway-addon';

import { Scanner } from 'google-home-notify-client';

interface Message {
  name: string,
  message: string,
  language: string
}

class GoogleHomeDevice extends Device {
  private messageByName: { [name: string]: Message } = {};

  constructor(adapter: any, manifest: any, private device: any) {
    super(adapter, `google-home-${device.ip}`);
    this['@context'] = 'https://iot.mozilla.org/schemas/';
    this.name = `${manifest.display_name} (${device.ip})`;
    this.description = manifest.description;
    const messages: Message[] = manifest.moziot.config.messages;

    const speakInput = {
      type: 'object',
      properties: {
        text: {
          type: 'string'
        }
      }
    };

    this.addSpeakAction('speak', speakInput);

    if (messages) {
      for (const message of messages) {
        this.messageByName[message.name] = message;
        console.log(`Creating action for ${message.name}`);
        this.addSpeakAction(message.name);
      }
    }
  }

  addSpeakAction(name: string, input?: any) {
    const description: any = {
      title: name,
      description: 'Read some text',
    };

    if (input) {
      description.input = input;
    }

    this.addAction(name, description);
  }

  async performAction(action: any) {
    action.start();

    if (action.name === 'speak') {
      console.log(`Speaking ${action.input.text}`);
      this.device.language(action.input.language);
      this.device.notify(action.input.text);
    } else {
      const message = this.messageByName[action.name];

      if (message) {
        console.log(`Speaking ${message}`);
        this.device.language(message.language);
        this.device.notify(message.message);
      } else {
        console.warn(`Unknown action ${action}`);
      }
    }

    action.finish();
  }
}

export class GoogleHomeAdapter extends Adapter {
  constructor(addonManager: any, manifest: any) {
    super(addonManager, GoogleHomeAdapter.name, manifest.name);
    addonManager.addAdapter(this);

    Scanner.scan((device: any) => {
      if (device.name && device.name.indexOf('_googlecast._tcp.local') > -1) {
        console.log(`Detected Google Home at ${device.ip}`);
        const googleHomeDevice = new GoogleHomeDevice(this, manifest, device);
        this.handleDeviceAdded(googleHomeDevice);
      }
    });
  }
}
