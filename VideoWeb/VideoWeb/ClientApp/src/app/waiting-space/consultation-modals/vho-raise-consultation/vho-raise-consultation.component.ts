import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConsultationAnswer } from 'src/app/services/clients/api-client';

@Component({
    selector: 'app-vho-raise-consultation',
    templateUrl: './vho-raise-consultation.component.html'
})
export class VhoRaiseConsultationComponent {
    @Input() allowRejection: boolean;
    @Output() answeredVhoCall = new EventEmitter<ConsultationAnswer>();
    constructor() {}

    acceptVhoConsultationRequest() {
        this.answeredVhoCall.emit(ConsultationAnswer.Accepted);
    }

    rejectVhoConsultationRequest() {
        this.answeredVhoCall.emit(ConsultationAnswer.Rejected);
    }
}
