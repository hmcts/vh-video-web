import { Component, Input } from '@angular/core';
import { Participant } from '../../shared/models/participant';

@Component({ selector: 'app-participant-network-status', template: '' })
export class VhoParticipantNetworkStatusStubComponent {
    @Input() participant: Participant;
 }
