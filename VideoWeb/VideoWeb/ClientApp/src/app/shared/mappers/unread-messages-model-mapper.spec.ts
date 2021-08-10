import { UnreadAdminMessageResponse } from 'src/app/services/clients/api-client';
import { UnreadAdminMessageModel } from '../../waiting-space/models/unread-admin-message-model';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { UnreadAdminMessageModelMapper } from './unread-messages-model-mapper';

describe('ParticipantPanelModelMapper', () => {
    let mapper: UnreadAdminMessageModelMapper;
    const conference = new ConferenceTestData().getConferenceDetailNow();
    const unreadMessagesCount = 5;

    beforeEach(() => {
        mapper = new UnreadAdminMessageModelMapper();
    });

    it('should map unread messages response array to conference', () => {
        // arrange
        const unreadMessages = conference.participants.map(
            p =>
                new UnreadAdminMessageModel(
                    new UnreadAdminMessageResponse({
                        number_of_unread_messages: unreadMessagesCount,
                        participant_id: p.id,
                        participant_username: p.name
                    }),
                    conference.id
                )
        );

        // act
        const result = mapper.mapUnreadMessageResponseArray(unreadMessages, conference.id);

        // assert
        expect(result.length).toBe(unreadMessages.length);

        result.forEach(x => {
            expect(x.conferenceId).toBeTruthy();
            expect(x.number_of_unread_messages).toBeTruthy();
            expect(x.participant_id).toBeTruthy();
            expect(x.participant_username).toBeTruthy();
        });
    });
});
