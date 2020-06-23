import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Participant } from 'src/app/shared/models/participant';

@Component({
    selector: 'app-raise-consultation',
    templateUrl: './raise-consultation.component.html'
})
export class RaiseConsultationComponent {
    @Input() consultationRequestee: Participant;
    @Output() cancelledRequest = new EventEmitter();
    constructor() {}

    cancelConsultationRequest() {
        this.cancelledRequest.emit();
    }

    get requesteeName(): string {
        return this.consultationRequestee.fullName;
    }
}
