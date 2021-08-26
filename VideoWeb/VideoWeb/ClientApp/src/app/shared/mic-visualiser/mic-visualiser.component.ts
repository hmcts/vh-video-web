import {
    Component,
    Input,
    OnDestroy,
    HostListener,
    ViewChild,
    ElementRef,
    AfterViewChecked,
    ChangeDetectorRef,
    AfterViewInit,
    OnChanges
} from '@angular/core';
import 'webrtc-adapter';

@Component({
    selector: 'app-mic-visualiser',
    templateUrl: './mic-visualiser.component.html',
    styleUrls: ['./mic-visualiser.component.scss']
})
export class MicVisualiserComponent implements AfterViewInit, OnDestroy, AfterViewChecked, OnChanges {
    canvasContext: CanvasRenderingContext2D;
    audioContext: AudioContext;
    source: MediaStreamAudioSourceNode;
    analyser: AnalyserNode;

    dataArray: Uint8Array;
    rafId: number;

    @ViewChild('meter') meterCanvas: ElementRef;
    @ViewChild('container') meterContainer: ElementRef;
    meterCurrentWidth: number;
    readonly meterMaxWidth = 270;

    constructor(private changeDetector: ChangeDetectorRef) {}

    @Input() stream: MediaStream;
    @Input() incomingStream: MediaStream;
    ngAfterViewInit() {
        this.canvasContext = this.meterCanvas.nativeElement.getContext('2d');
    }

    ngOnChanges(): void {
        this.setupStream();
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        cancelAnimationFrame(this.rafId);
    }

    ngAfterViewChecked() {
        this.meterCurrentWidth = this.meterContainer.nativeElement.offsetWidth;
        this.changeDetector.detectChanges();
    }

    setupStream() {
        if (!this.stream) {
            throw new Error('No stream provided');
        }
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        // create mixer
        const merger = this.audioContext.createChannelMerger();

        this.source.connect(merger, 0, 0);
        if (this.incomingStream) {
            const incomingSource = this.audioContext.createMediaStreamSource(this.incomingStream);
            incomingSource.connect(merger, 0, 0);
        }

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
        const scaleMultiplier = 1.75;

        const canvasWidth = this.meterCanvas.nativeElement.scrollWidth;
        const canvasHeight = this.meterCanvas.nativeElement.scrollHeight;

        this.canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
        this.canvasContext.fillStyle = 'green';
        this.canvasContext.fillRect(0, 0, (feedback / this.meterMaxWidth) * canvasWidth * scaleMultiplier, canvasHeight);
    }

    tick() {
        this.processStream();
        this.rafId = requestAnimationFrame(this.tick.bind(this));
    }
}
