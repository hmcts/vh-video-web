import { Component, Input } from '@angular/core';
import { ConferenceForHostResponse } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-judge-hearing-table', template: '' })
export class JudgeHearingTableStubComponent {
    @Input() conferences: ConferenceForHostResponse[];
}
