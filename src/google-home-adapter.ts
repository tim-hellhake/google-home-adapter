/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Adapter } from 'gateway-addon';

import { Scanner } from 'google-home-notify-client';

import { GoogleHomeDevice } from './google-home-device';

import { InMemoryServer } from './in-memory-server';

export class GoogleHomeAdapter extends Adapter {
  constructor(addonManager: any, manifest: any) {
    super(addonManager, GoogleHomeAdapter.name, manifest.name);
    addonManager.addAdapter(this);

    const server = new InMemoryServer();

    Scanner.scan((device: any) => {
      const prefix = '._googlecast._tcp.local';

      if (device.name && device.name.indexOf(prefix) > -1) {
        const name = device.name.replace(prefix, '');
        console.log(`Detected ${name} at ${device.ip}`);
        const googleHomeDevice = new GoogleHomeDevice(this, manifest, name, device.ip, server);
        this.handleDeviceAdded(googleHomeDevice);

        try {
          const { GoogleHomeNotifier } = require('./google-home-notifier');
          new GoogleHomeNotifier(addonManager, manifest.name, googleHomeDevice);
        } catch (e) {
          console.error(e);
          if (!(e instanceof TypeError)) {
            console.error(e);
          } else {
            console.warn('Notifier api not supported by this version of the gateway');
          }
        }
      }
    });
  }
}
