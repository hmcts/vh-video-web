import { UnreadAdminMessageResponse } from 'src/app/services/clients/api-client';
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
                new UnreadAdminMessageResponse({
                    number_of_unread_messages: unreadMessagesCount,
                    participant_id: p.id,
                    participant_username: p.name
                })
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

            const participantUnreadMessage = unreadMessages.find(p => p.participant_id === x.participant_id);

            expect(x.number_of_unread_messages).toEqual(participantUnreadMessage.number_of_unread_messages);
            expect(x.participant_id).toEqual(participantUnreadMessage.participant_id);
            expect(x.participant_username).toEqual(participantUnreadMessage.participant_username);
        });
    });
});
