import { Directive, EventEmitter, Input, Output } from '@angular/core';

@Directive({
    selector: '[hookelement]'
})
export class HookElement {
    videoContainerReady = true;
    overflowDivReady = true;
    participantDivReady = true;
    @Input() readyElm: string;
    @Output('readyEvent') initEvent: EventEmitter<any> = new EventEmitter();

    ngOnInit(): void {
        if (this.readyElm == 'videoContainer' && this.videoContainerReady) {
            this.videoContainerReady = false;
            setTimeout(() => this.initEvent.emit(), 20);
        } else if (this.readyElm == 'overflowDiv' && this.overflowDivReady) {
            this.overflowDivReady = false;
            setTimeout(() => this.initEvent.emit(), 20);
        } else if (this.readyElm == 'participantDiv' && this.participantDivReady) {
            this.participantDivReady = false;
            setTimeout(() => this.initEvent.emit(), 20);
        }
    }
}
