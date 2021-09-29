export class StreamMixer {
    mergeAudioStreams(...streams: MediaStream[]) {
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();

        streams.forEach(s => {
            const stream = new MediaStream();
            stream.addTrack(s.getAudioTracks()[0]);
            const streamSource = audioContext.createMediaStreamSource(stream);

            streamSource.connect(destination);
        });
        return destination.stream;
    }
}
