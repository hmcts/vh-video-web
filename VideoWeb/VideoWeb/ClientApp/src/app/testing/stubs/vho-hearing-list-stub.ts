import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConferenceForVhOfficerResponse } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-vho-hearing-list', template: '' })
export class VhoHearingListStubComponent {
    @Input() conferences: ConferenceForVhOfficerResponse[];
    @Output() selectedConference = new EventEmitter<ConferenceForVhOfficerResponse>();
    @Output() selectedParticipant = new EventEmitter<any>();
    currentConference: ConferenceForVhOfficerResponse;
}
