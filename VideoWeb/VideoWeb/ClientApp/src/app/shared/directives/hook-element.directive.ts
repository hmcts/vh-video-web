import { Directive, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Directive({
    selector: '[appHookElement]'
})
export class HookElementDirective implements OnInit {
    @Input() readyElm: string;
    @Output() readyEvent: EventEmitter<any> = new EventEmitter();

    videoContainerReady = true;
    overflowDivReady = true;
    participantDivReady = true;

    ngOnInit(): void {
        if (this.readyElm === 'videoContainer' && this.videoContainerReady) {
            this.videoContainerReady = false;
            setTimeout(() => this.readyEvent.emit(), 20);
        } else if (this.readyElm === 'overflowDiv' && this.overflowDivReady) {
            this.overflowDivReady = false;
            setTimeout(() => this.readyEvent.emit(), 20);
        } else if (this.readyElm === 'participantDiv' && this.participantDivReady) {
            this.participantDivReady = false;
            setTimeout(() => this.readyEvent.emit(), 20);
        }
    }
}
