import { Component, Input } from '@angular/core';
import { ConferenceResponse } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-judge-participant-status-list', template: '' })
export class JudgeParticipantStatusListStubComponent {
    @Input() conference: ConferenceResponse[];
}

@Component({ selector: 'app-individual-participant-status-list', template: '' })
export class IndividualParticipantStatusListStubComponent {
    @Input() conference: ConferenceResponse[];
}
