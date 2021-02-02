import { Guid } from 'guid-typescript';
import { ConferenceResponse, LoggedParticipantResponse, Role } from '../services/clients/api-client';
import { InstantMessage } from '../services/models/instant-message';
import { ConferenceTestData } from '../testing/mocks/data/conference-test-data';
import { ImHelper } from './im-helper';
import { Hearing } from './models/hearing';

describe('ImHelper', () => {
    const imHelper = new ImHelper();
    const conference: ConferenceResponse = new ConferenceTestData().getConferenceDetailFuture();
    const hearing = new Hearing(conference);
    const adminUsername = 'admin@user.com';
    const judgeUsername = hearing.judge.id;

    let adminProfile: LoggedParticipantResponse;
    let judgeProfile: LoggedParticipantResponse;

    let message: InstantMessage;

    beforeEach(() => {
        adminProfile = new LoggedParticipantResponse({
            display_name: 'Test Admin',
            participant_id: '',
            admin_username: adminUsername,
            role: Role.VideoHearingsOfficer
        });
        judgeProfile = new LoggedParticipantResponse({
            display_name: 'Judge Fudge',
            participant_id: conference.participants[2].id,
            admin_username: '',
            role: Role.Judge
        });
        message = new InstantMessage({
            conferenceId: conference.id,
            from: adminUsername,
            from_display_name: 'Admin Test',
            to: judgeUsername,
            id: Guid.create().toString(),
            is_user: false,
            message: 'test auto',
            timestamp: new Date()
        });
    });

    it('should return true when message is sent from participant A to admin and admin has participant A chat open', () => {
        message = new InstantMessage({
            conferenceId: conference.id,
            from: conference.participants[2].id,
            from_display_name: judgeProfile.display_name,
            to: adminUsername,
            id: Guid.create().toString(),
            is_user: false,
            message: 'test auto',
            timestamp: new Date()
        });
        expect(imHelper.isImForUser(message, conference.participants[2].id, adminProfile)).toBeTruthy();
    });

    it('should return false when message is sent from participant A to admin and admin has participant B chat open', () => {
        const imOther = new InstantMessage({
            conferenceId: conference.id,
            from: conference.participants[0].id,
            from_display_name: 'Test Other',
            to: adminUsername,
            id: Guid.create().toString(),
            is_user: false,
            message: 'test auto',
            timestamp: new Date()
        });

        expect(imHelper.isImForUser(imOther, conference.participants[2].id, adminProfile)).toBeFalsy();
    });

    it('should return true when message is sent from admin to participant A logged in as participant A', () => {
        message = new InstantMessage({
            conferenceId: conference.id,
            from: adminUsername,
            from_display_name: adminProfile.display_name,
            to: conference.participants[2].id,
            id: Guid.create().toString(),
            is_user: false,
            message: 'test auto',
            timestamp: new Date()
        });

        expect(imHelper.isImForUser(message, null, judgeProfile)).toBeTruthy();
    });

    it('should return false when message is sent from admin to participant B but logged in as Participant A', () => {
        const nonChatUser = new LoggedParticipantResponse({
            display_name: 'Test Rep',
            participant_id: '1111-2222',
            role: Role.Representative
        });
        message = new InstantMessage({
            conferenceId: conference.id,
            from: adminUsername,
            from_display_name: adminProfile.display_name,
            to: conference.participants[2].id,
            id: Guid.create().toString(),
            is_user: false,
            message: 'test auto',
            timestamp: new Date()
        });

        expect(imHelper.isImForUser(message, null, nonChatUser)).toBeFalsy();
    });
});
