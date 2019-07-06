/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Adapter, Device, } from 'gateway-addon';

import { Scanner } from 'google-home-notify-client';

import googletts from 'google-tts-api';

import { Client, DefaultMediaReceiver } from 'castv2-client';

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
        },
        language: {
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
      this.speak(this.device.ip, action.input.text, action.input.language)
    } else {
      const message = this.messageByName[action.name];

      if (message) {
        console.log(`Speaking ${message}`);
        this.speak(this.device.ip, message.message, message.language)
      } else {
        console.warn(`Unknown action ${action}`);
      }
    }

    action.finish();
  }

  async speak(ip: string, text: string, lang: string) {
    const url = await googletts(text, lang, 1, 10 * 1000);
    const client = new Client();

    client.connect(ip, () => {
      client.launch(DefaultMediaReceiver, (error, player) => {
        if (error) {
          console.error(`Could not launch default DefaultMediaReceiver: ${error}`);
        }

        if (player) {
          const media = {
            contentId: url,
            contentType: 'audio/mp3',
            streamType: 'BUFFERED'
          };

          const options = {
            autoplay: true
          };

          player.load(media, options, (error) => {
            if (error) {
              console.error(`Could not load media: ${error}`);
            }

            client.close();
          });
        }
      });
    });
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
