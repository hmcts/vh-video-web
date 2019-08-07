import { Component, Input } from '@angular/core';
import { ParticipantResponse } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-individual-consultation-controls', template: '' })
export class IndividualConsultationControlsStubComponent {
    @Input() participants: ParticipantResponse[];
    nonJugdeParticipants: ParticipantResponse[];
}
