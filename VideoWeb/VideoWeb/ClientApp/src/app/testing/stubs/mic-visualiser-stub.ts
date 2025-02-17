import { Component, Input } from '@angular/core';

@Component({
    standalone: false, selector: 'app-mic-visualiser', template: '' })
export class MicVisualiserStubComponent {
    @Input() stream: MediaStream;
    @Input() incomingStream: MediaStream;
}
