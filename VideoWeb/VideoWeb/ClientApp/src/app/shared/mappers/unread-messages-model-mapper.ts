import { UnreadAdminMessageResponse } from 'src/app/services/clients/api-client';
import { UnreadAdminMessageModel } from '../../waiting-space/models/unread-admin-message-model';

export class UnreadAdminMessageModelMapper {
    mapUnreadMessageResponseArray(unreadMessagesReponse: UnreadAdminMessageResponse[], conferenceId: string): UnreadAdminMessageModel[] {
        const unreadMessages: UnreadAdminMessageModel[] = [];
        unreadMessagesReponse.forEach(x => {
            const participant = this.mapFromMessageResponse(x, conferenceId);
            unreadMessages.push(participant);
        });
        return unreadMessages;
    }

    mapFromMessageResponse(unreadMessagesReponse: UnreadAdminMessageResponse, conferenceId: string): UnreadAdminMessageModel {
        return new UnreadAdminMessageModel(unreadMessagesReponse, conferenceId);
    }
}
