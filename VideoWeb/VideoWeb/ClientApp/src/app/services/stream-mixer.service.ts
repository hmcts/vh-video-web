import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class StreamMixerService {
    mergeAudioStreams(...streams: MediaStream[]) {
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();

        const streamsWithAudio = streams.filter(s => s.getAudioTracks().length > 0);
        streamsWithAudio.forEach(s => {
            const stream = new MediaStream();
            stream.addTrack(s.getAudioTracks()[0]);
            const streamSource = audioContext.createMediaStreamSource(stream);

            streamSource.connect(destination);
        });
        return destination.stream;
    }
}
