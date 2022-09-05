import { AfterViewInit, Directive, Input } from '@angular/core';
//import { ModalTrapFocus } from '../modal/modal-trap-focus';

@Directive({
    selector: '[hookelement]'
})
export class HookElement implements AfterViewInit {
    @Input() hookElement = () => { };

    constructor() {}

    ngAfterViewInit(): void {
        //ModalTrapFocus.trap('video-container');
        //alert(this.el.nativeElement.id);
        //this.hookElement();
    }
}
