export class StreamMixer {
    mergeAudioStreams(...streams: MediaStream[]) {
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();

        const streamsWithAudio = streams.filter(s => s.getAudioTracks().length);
        streamsWithAudio.forEach(s => {
            const stream = new MediaStream();
            stream.addTrack(s.getAudioTracks()[0]);
            const streamSource = audioContext.createMediaStreamSource(stream);

            streamSource.connect(destination);
        });
        return destination.stream;
    }
}
