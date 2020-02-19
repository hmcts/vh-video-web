import { Component, Input } from '@angular/core';
import { ConferenceForUserResponse } from 'src/app/services/clients/api-client';
@Component({ selector: 'app-vho-chat', template: '' })
export class VhoChatStubComponent {
    @Input() conference: ConferenceForUserResponse;
}
