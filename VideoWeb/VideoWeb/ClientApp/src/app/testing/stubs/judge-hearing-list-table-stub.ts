import { Component, Input } from '@angular/core';
import { ConferenceForUserResponse } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-judge-hearing-table', template: '' })
export class JudgeHearingTableStubComponent {
    @Input() conferences: ConferenceForUserResponse[];
}
