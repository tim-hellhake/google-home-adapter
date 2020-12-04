/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import { randomBytes } from 'crypto';
import http from 'http';
import url from 'url';
import os from 'os';

export class InMemoryServer {
    private cache: Record<string, Buffer> = {};
    private ip: string;

    constructor(private port: number = 54321) {
        this.ip = this.getIpAddress();

        http.createServer((req, res) => {
            const { pathname } = url.parse(req.url ?? '');
            const [id] = pathname?.split('/')?.filter(x => x) ?? [];

            if (!id) {
                console.warn('Missing id');
                res.statusCode = 400;
                res.end();
                return;
            }

            const buffer = this.cache[id];

            if (!buffer) {
                console.warn(`No data found for id '${id}'`);
                res.statusCode = 404;
                res.end();
                return;
            }

            res.setHeader('Content-Type', 'audio/mpeg');
            res.write(buffer);
            res.end();
        }).listen(port);

        console.log(`Listening on http://${this.ip}:${this.port}`);
    }

    private getIpAddress(): string {
        const networkInterfaces = os.networkInterfaces();

        for (const nic of Object.values(networkInterfaces)) {
            if (nic) {
                for (const nicIf of nic) {
                    if (nicIf) {
                        if (!nicIf.internal && nicIf.address) {
                            return nicIf.address;
                        }
                    }
                }
            }
        }

        throw new Error('No local ip address detected');
    }

    public generateUrl(buffer: Buffer): string {
        const id = randomBytes(64).toString('hex');
        this.cache[id] = buffer;
        return `http://${this.ip}:${this.port}/${id}`;
    }
}
