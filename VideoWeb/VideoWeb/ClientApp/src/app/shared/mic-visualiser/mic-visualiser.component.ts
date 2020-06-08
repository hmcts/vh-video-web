import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import 'webrtc-adapter';

@Component({
    selector: 'app-mic-visualiser',
    templateUrl: './mic-visualiser.component.html'
})
export class MicVisualiserComponent implements OnInit, OnDestroy {
    canvasContext: CanvasRenderingContext2D;
    audioContext: AudioContext;
    source: MediaStreamAudioSourceNode;
    analyser: AnalyserNode;

    dataArray: Uint8Array;
    rafId: number;

    constructor() {}

    @Input() stream: MediaStream;
    @Input() incomingStream: MediaStream;
    ngOnInit() {
        const canvas = <HTMLCanvasElement>document.getElementById('meter');
        this.canvasContext = canvas.getContext('2d');
        this.setupStream();
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        cancelAnimationFrame(this.rafId);
    }

    setupStream() {
        if (!this.stream) {
            throw new Error('No stream provided');
        }
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        const incomingSource = this.audioContext.createMediaStreamSource(this.incomingStream);
        // create mixer
        const merger = this.audioContext.createChannelMerger();

        this.source.connect(merger, 0, 0);
        incomingSource.connect(merger, 0, 0);
        merger.connect(this.analyser);

        this.analyser.smoothingTimeConstant = 0.8;
        this.analyser.fftSize = 1024;

        this.rafId = requestAnimationFrame(this.tick.bind(this));
    }

    processStream() {
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(this.dataArray);

        let values = 0;
        const length = this.dataArray.length;
        for (let i = 0; i < length; i++) {
            values += this.dataArray[i];
        }
        const average = values / length;
        this.fillMeter(Math.round(average));
    }

    fillMeter(feedback: number) {
        const width = 270;
        const height = 50;
        this.canvasContext.clearRect(0, 0, width, height);
        this.canvasContext.fillStyle = 'green';
        this.canvasContext.fillRect(0, 0, feedback * 1.75, height);
    }

    tick() {
        this.processStream();
        this.rafId = requestAnimationFrame(this.tick.bind(this));
    }
}
