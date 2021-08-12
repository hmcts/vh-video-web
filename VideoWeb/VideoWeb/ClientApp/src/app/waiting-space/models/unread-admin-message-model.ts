import { UnreadAdminMessageResponse } from 'src/app/services/clients/api-client';

export class UnreadAdminMessageModel extends UnreadAdminMessageResponse {
    conferenceId?: string;

    constructor(messageResponse: UnreadAdminMessageResponse, conferenceId: string) {
        super(messageResponse);
        this.conferenceId = conferenceId;
    }
}
