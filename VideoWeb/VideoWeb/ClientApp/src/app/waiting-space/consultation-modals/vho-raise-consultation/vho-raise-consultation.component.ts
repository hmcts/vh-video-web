import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-vho-raise-consultation',
    templateUrl: './vho-raise-consultation.component.html'
})
export class VhoRaiseConsultationComponent {
    @Output() acceptedVhoCall = new EventEmitter();
    constructor() {}

    acceptVhoConsultationRequest() {
        this.acceptedVhoCall.emit();
    }
}
