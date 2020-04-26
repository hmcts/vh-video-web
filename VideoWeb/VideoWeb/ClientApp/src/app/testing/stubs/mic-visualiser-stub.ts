import { Component, Input } from '@angular/core';

@Component({ selector: 'app-mic-visualiser', template: '' })
export class MicVisualiserStubComponent {
    @Input() stream: MediaStream;
    @Input() incomingStream: MediaStream;

}
