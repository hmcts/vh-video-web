import { Component, Input } from '@angular/core';
import { ConsultationAnswer, ParticipantResponse, VideoEndpointResponse } from 'src/app/services/clients/api-client';

@Component({
    selector: 'app-private-consultation-participant-status',
    templateUrl: './private-consultation-participant-status.component.html',
    styleUrls: ['./private-consultation-participant-status.component.scss']
})
export class PrivateConsultationParticipantStatusComponent {
    ConsultationAnswer = ConsultationAnswer;
    @Input() entity: ParticipantResponse | VideoEndpointResponse;
    @Input() status: string;
    @Input() roomLabel: string;
    private availableStatuses = ['Available', 'Connected', 'InConsultation'];

    isAvailable(): boolean {
        return this.availableStatuses.indexOf(this.entity.status) >= 0;
    }

    isInCurrentRoom(): boolean {
        return this.entity?.current_room?.label === this.roomLabel;
    }
}
