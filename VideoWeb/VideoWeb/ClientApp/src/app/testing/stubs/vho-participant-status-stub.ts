import { Component, Input } from '@angular/core';
import { ParticipantResponse } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-participant-status', template: '' })
export class VhoParticipantStatusStubComponent {
    @Input() participants: ParticipantResponse[];
    nonJugdeParticipants: ParticipantResponse[];
}
