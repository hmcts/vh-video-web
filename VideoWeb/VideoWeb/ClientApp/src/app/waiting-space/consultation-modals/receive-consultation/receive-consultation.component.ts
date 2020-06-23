import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConsultationAnswer } from 'src/app/services/clients/api-client';
import { Participant } from 'src/app/shared/models/participant';

@Component({
    selector: 'app-receive-consultation',
    templateUrl: './receive-consultation.component.html'
})
export class ReceiveConsultationComponent {
    @Input() consultationRequester: Participant;
    @Output() respondedToConsulation = new EventEmitter<ConsultationAnswer>();
    constructor() {}

    get requesterName(): string {
        return this.consultationRequester.fullName;
    }

    acceptConsultationRequest() {
        this.respondedToConsulation.emit(ConsultationAnswer.Accepted);
    }
    rejectConsultationRequest() {
        this.respondedToConsulation.emit(ConsultationAnswer.Rejected);
    }
}
