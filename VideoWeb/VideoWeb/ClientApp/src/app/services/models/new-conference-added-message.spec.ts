import { NewConferenceAddedMessage } from './new-conference-added-message';

describe('NewConferenceAddedMessage', () => {
    it('creates an instance with the specified conference id', () => {
        const conferenceId = 'conference-id';
        const conferenceAddedMessage = new NewConferenceAddedMessage(conferenceId);

        expect(conferenceAddedMessage.conferenceId).toBe(conferenceId);
    });
});
