import { Component, OnInit } from '@angular/core';
import 'webrtc-adapter';

@Component({
  selector: 'app-mic-visualiser',
  templateUrl: './mic-visualiser.component.html'
})
export class MicVisualiserComponent implements OnInit {

  canvasContext: CanvasRenderingContext2D;
  audioContext: AudioContext;
  microphone: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  javascriptNode: ScriptProcessorNode;

  _navigator = <any>navigator;

  constructor() { }

  ngOnInit() {
    this._navigator = <any>navigator;
    const canvas = <HTMLCanvasElement>document.getElementById('meter');
    this.canvasContext = canvas.getContext('2d');
    this.requestMedia();
  }

  requestMedia() {
    const mediaConstraints = {
      audio: true
    };

    this._navigator.getUserMedia = (this._navigator.getUserMedia || this._navigator.webkitGetUserMedia
      || this._navigator.mozGetUserMedia || this._navigator.msGetUserMedia);

    this._navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then(this.successCallback.bind(this), this.errorCallback.bind(this));
  }

  successCallback(stream: MediaStream) {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.microphone = this.audioContext.createMediaStreamSource(stream);
    this.javascriptNode = this.audioContext.createScriptProcessor(2048, 1, 1);
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.fftSize = 1024;

    this.microphone.connect(this.analyser);
    this.analyser.connect(this.javascriptNode);
    this.javascriptNode.connect(this.audioContext.destination);

    const self = this;
    this.javascriptNode.onaudioprocess = function () {
      const array = new Uint8Array(self.analyser.frequencyBinCount);
      self.analyser.getByteFrequencyData(array);

      let values = 0;
      const length = array.length;
      for (let i = 0; i < length; i++) {
        values += (array[i]);
      }
      const average = values / length;
      self.fillMeter(Math.round(average));
    };
  }

  fillMeter(feedback: number) {
    const width = 270;
    const height = 50;

    this.canvasContext.clearRect(0, 0, width, height);
    this.canvasContext.fillStyle = 'green';
    this.canvasContext.fillRect(0, 0, feedback * 4, height);
  }

  errorCallback(error: MediaStreamError) {
    console.log('not got your mic!');
  }
}
