import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConferenceForUserResponse } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-vho-hearing-list', template: '' })
export class VhoHearingListStubComponent {
  @Input() conferences: ConferenceForUserResponse[];
  @Output() selectedConference = new EventEmitter<ConferenceForUserResponse>();
  @Output() selectedParticipant = new EventEmitter<any>();
  currentConference: ConferenceForUserResponse;
}
