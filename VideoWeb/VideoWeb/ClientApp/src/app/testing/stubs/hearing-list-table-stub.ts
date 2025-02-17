import { Component, Input } from '@angular/core';
import { ConferenceForIndividualResponse } from 'src/app/services/clients/api-client';

@Component({
    standalone: false, selector: 'app-hearing-list-table', template: '' })
export class HearingListTableStubComponent {
    @Input() conferences: ConferenceForIndividualResponse[];
}
