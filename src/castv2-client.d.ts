/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

interface Type<T> extends Function { new(...args: any[]): T; }

interface PlayerStatus {
    playerState: string,
    idleReason: string
}

interface Level {
    level: number
}

declare module 'castv2-client' {
    class Client {
        public connect(options: {}, callback: () => void): void;
        public launch<T>(application: Type<T>, callback: (error?: any, application?: T) => void): void;
        public close(): void;
        public stop(application: {}, callback: (error?: any, applications?: []) => void): void;
        public setVolume(options: Level, callback: (error: any, level: Level) => void): void;
        public getVolume(callback: (error: any, level: Level) => void): void;
    }

    class DefaultMediaReceiver {
        public load(media: {}, options: {}, callback: (error?: any, status?: any) => void): void;
        public on(type: 'status', listener: (status: PlayerStatus) => void): void;
    }
}
