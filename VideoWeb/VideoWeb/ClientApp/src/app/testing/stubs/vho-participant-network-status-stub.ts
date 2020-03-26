import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Participant } from '../../shared/models/participant';
import { ParticipantSummary } from '../../shared/models/participant-summary';

@Component({ selector: 'app-participant-network-status', template: '' })
export class VhoParticipantNetworkStatusStubComponent {
  @Input() participant: Participant;
  @Output()
  showMonitorGraph: EventEmitter<ParticipantSummary> = new EventEmitter<ParticipantSummary>();

 }
