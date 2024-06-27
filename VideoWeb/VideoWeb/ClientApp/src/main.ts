import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import '@angular/compiler';
import 'webrtc-adapter';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

export function getBaseUrl() {
    return document.getElementsByTagName('base')[0].href;
}

const providers = [{ provide: 'BASE_URL', useFactory: getBaseUrl, deps: [] }];

// TODO: reminder to remove this before merge

// navigator.mediaDevices.getUserMedia = () => {
//     console.warn('using shaed mock - get user media');
//     return Promise.resolve(new MediaStream());
// };
// navigator.mediaDevices.enumerateDevices = () => {
//     console.warn('using shaed mock - enumerate devices');
//     return Promise.resolve([]);
// };

const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);

navigator.mediaDevices.getUserMedia = constraints => {
    console.warn('using shaed mock - get user media');
    return originalGetUserMedia(constraints).then(stream => {
        // Get all video tracks from the stream
        const videoTracks = stream.getVideoTracks();
        // Remove each video track from the stream
        videoTracks.forEach(track => stream.removeTrack(track));
        // Return the modified stream without video tracks
        return stream;
    });
};

navigator.mediaDevices.enumerateDevices = () => {
    console.warn('using shaed mock - enumerate devices');
    return originalEnumerateDevices().then(devices => devices.filter(device => device.kind !== 'videoinput'));
};

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic(providers)
    .bootstrapModule(AppModule)
    .catch(err => console.error(err));
