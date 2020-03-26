import { Component, Input } from '@angular/core';
import { ConferenceForJudgeResponse } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-judge-hearing-table', template: '' })
export class JudgeHearingTableStubComponent {
    @Input() conferences: ConferenceForJudgeResponse[];
}
