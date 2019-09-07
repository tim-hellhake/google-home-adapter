/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Constants, Notifier, Outlet } from 'gateway-addon';

import { GoogleHomeDevice } from './google-home-device';

class GoogleHomeOutlet extends Outlet {
    constructor(notifier: Notifier, private device: GoogleHomeDevice) {
        super(notifier, device.id);
        this.name = device.name;
    }

    async notify(_title: string, message: string, _level: Constants.NotificationLevel) {
        this.device.speak(message);
    }
}

export class GoogleHomeNotifier extends Notifier {
    constructor(addonManager: any, packageName: string, device: GoogleHomeDevice) {
        super(addonManager, device.id, packageName);

        addonManager.addNotifier(this);

        this.handleOutletAdded(
            new GoogleHomeOutlet(this, device)
        );
    }
}
