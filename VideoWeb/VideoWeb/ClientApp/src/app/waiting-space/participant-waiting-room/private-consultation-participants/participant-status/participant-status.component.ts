import { Component, Input, OnInit } from '@angular/core';
import { ConsultationAnswer, EndpointResponse, ParticipantResponse } from 'src/app/services/clients/api-client';

@Component({
    selector: 'app-participant-status',
    templateUrl: './participant-status.component.html',
    styleUrls: ['./participant-status.component.scss']
})
export class ParticipantStatusComponent implements OnInit {
    ConsultationAnswer = ConsultationAnswer;
    @Input() entity: ParticipantResponse | EndpointResponse;
    @Input() status: string;
    @Input() roomLabel: string;
    private availableStatuses = ['Available', 'Connected', 'InConsultation'];
    constructor() {}

    ngOnInit(): void {}

    isAvailable(): boolean {
        console.log(this.entity);
        return this.availableStatuses.indexOf(this.entity.status) >= 0;
    }

    isInCurrentRoom(): boolean {
        return this.entity?.current_room?.label === this.roomLabel;
    }
}
