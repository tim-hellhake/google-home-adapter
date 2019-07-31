/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { Device } from 'gateway-addon';

import googletts from 'google-tts-api';

import { Client, DefaultMediaReceiver } from 'castv2-client';

interface Message {
    name: string,
    message: string,
    language: string,
    volume: number
}

export class GoogleHomeDevice extends Device {
    private messageByName: { [name: string]: Message } = {};
    private readonly debug: boolean;

    constructor(adapter: any, private manifest: any, private device: any) {
        super(adapter, `google-home-${device.ip}`);
        this['@context'] = 'https://iot.mozilla.org/schemas/';
        this.name = `${manifest.display_name} (${device.ip})`;
        this.description = manifest.description;
        this.debug = manifest.moziot.config.debug;
        const messages: Message[] = manifest.moziot.config.messages;

        const speakInput = {
            type: 'object',
            properties: {
                text: {
                    type: 'string'
                },
                language: {
                    type: 'string'
                },
                volume: {
                    type: 'integer',
                    unit: '%',
                    minimum: 0,
                    maximum: 100
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

    verbose(s: string) {
        if (this.debug) {
            console.log(s);
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

        this.verbose(`Adding action ${JSON.stringify(description, null, 2)}`);

        this.addAction(name, description);
    }

    async performAction(action: any) {
        action.start();

        const { defaultLanguage } = this.manifest.moziot.config;

        if (action.name === 'speak') {
            console.log(`Speaking ${action.input.text}`);
            this.speak(this.device.ip, action.input.text, action.input.language || defaultLanguage, action.input.volume || 0.5)
        } else {
            const message = this.messageByName[action.name];

            if (message) {
                console.log(`Speaking ${message.message}`);
                this.speak(this.device.ip, message.message, message.language || defaultLanguage, message.volume || 0.5)
            } else {
                console.warn(`Unknown action ${action}`);
            }
        }

        action.finish();
    }

    async speak(ip: string, text: string, lang: string, volume?: number) {
        const url = await googletts(text, lang, 1, 10 * 1000);
        const client = new Client();

        this.verbose(`Connecting to ${ip}`);

        client.connect(ip, () => {
            let originalLevel: number;

            client.getVolume((error, level) => {
                if (error) {
                    console.error(`Could not get volume: ${error}`);
                } else {
                    originalLevel = level.level;
                    this.verbose(`Current volume is ${originalLevel}`);
                }
            });

            const { defaultVolume } = this.manifest.moziot.config;

            const level = (volume || defaultVolume) / 100;

            this.verbose(`Set volume to ${level}`);

            client.setVolume({ level }, (error) => {
                if (error) {
                    console.error(`Could not increase volume: ${error}`);
                }
            });

            this.verbose(`Launching ${DefaultMediaReceiver.name}`);

            client.launch(DefaultMediaReceiver, (error, player) => {
                if (error) {
                    console.error(`Could not launch DefaultMediaReceiver: ${error}`);
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

                    this.verbose(`Playing ${url}`);

                    player.load(media, options, (error) => {
                        if (error) {
                            console.error(`Could not load media: ${error}`);
                        }

                        player.on('status', (status) => {
                            this.verbose(`New player state is ${status.playerState} (idle reason: ${status.idleReason})`);

                            if (status.idleReason === 'FINISHED') {
                                this.verbose(`Closing player`);

                                client.stop(player, (error) => {
                                    if (error) {
                                        console.error(`Could not stop DefaultMediaReceiver: ${error}`);
                                    }
                                });

                                if (originalLevel) {
                                    this.verbose(`Reset volume to ${originalLevel}`);

                                    client.setVolume({ level: originalLevel }, (error) => {
                                        if (error) {
                                            console.error(`Could not reset original volume: ${error}`);
                                        }

                                        this.verbose('Closing client');
                                        client.close();
                                    });
                                }
                            }
                        })
                    });
                }
            });
        });
    }
}
