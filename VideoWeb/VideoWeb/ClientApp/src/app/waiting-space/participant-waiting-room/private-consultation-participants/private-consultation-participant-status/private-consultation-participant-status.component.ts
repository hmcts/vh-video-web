import { Component, Input } from '@angular/core';
import { ConsultationAnswer } from 'src/app/services/clients/api-client';
import { VHEndpoint, VHParticipant } from '../../../store/models/vh-conference';

@Component({
    selector: 'app-private-consultation-participant-status',
    templateUrl: './private-consultation-participant-status.component.html',
    styleUrls: ['./private-consultation-participant-status.component.scss']
})
export class PrivateConsultationParticipantStatusComponent {
    @Input() entity: VHParticipant | VHEndpoint;
    @Input() status: string;
    @Input() roomLabel: string;

    ConsultationAnswer = ConsultationAnswer;

    private availableStatuses = ['Available', 'Connected', 'InConsultation'];

    isAvailable(): boolean {
        return this.availableStatuses.indexOf(this.entity.status) >= 0;
    }

    isInCurrentRoom(): boolean {
        return this.entity?.room?.label === this.roomLabel;
    }
}
