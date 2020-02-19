import { Component, Input } from '@angular/core';
import { ConferenceForUserResponse } from 'src/app/services/clients/api-client';
@Component({ selector: 'app-judge-chat', template: '' })
export class JudgeChatStubComponent {
    @Input()
    conference: ConferenceForUserResponse;
}
