import { Component, Input } from '@angular/core';
import { Participant } from 'src/app/shared/models/participant';

@Component({
    selector: 'app-accepted-consultation',
    templateUrl: './accepted-consultation.component.html'
})
export class AcceptedConsultationComponent {
    @Input() consultationRequestee: Participant;
    constructor() {}

    get requesteeName(): string {
        return this.consultationRequestee.fullName;
    }
}
