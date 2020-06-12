import { Guid } from 'guid-typescript';
import { ConferenceResponse, Role, UserProfileResponse } from '../services/clients/api-client';
import { InstantMessage } from '../services/models/instant-message';
import { ConferenceTestData } from '../testing/mocks/data/conference-test-data';
import { ImHelper } from './im-helper';
import { Hearing } from './models/hearing';

describe('ImHelper', () => {
    const imHelper = new ImHelper();
    const conference: ConferenceResponse = new ConferenceTestData().getConferenceDetailFuture();
    const hearing = new Hearing(conference);
    const adminUsername = 'admin@user.com';
    const judgeUsername = hearing.judge.username;

    let adminProfile: UserProfileResponse;
    let judgeProfile: UserProfileResponse;

    let message: InstantMessage;

    beforeEach(() => {
        adminProfile = new UserProfileResponse({
            display_name: 'Test Admin',
            first_name: 'Test',
            last_name: 'Admin',
            role: Role.VideoHearingsOfficer,
            username: adminUsername
        });
        judgeProfile = new UserProfileResponse({
            display_name: 'Judge Fudge',
            first_name: 'Judge',
            last_name: 'Fudge',
            role: Role.Judge,
            username: judgeUsername
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
            from: judgeUsername,
            from_display_name: judgeProfile.display_name,
            to: adminUsername,
            id: Guid.create().toString(),
            is_user: false,
            message: 'test auto',
            timestamp: new Date()
        });

        expect(imHelper.isImForUser(message, judgeUsername, adminProfile)).toBeTruthy();
    });

    it('should return false when message is sent from participant A to admin and admin has participant B chat open', () => {
        const imOther = new InstantMessage({
            conferenceId: conference.id,
            from: 'notjudge@test.com',
            from_display_name: 'Test Other',
            to: adminUsername,
            id: Guid.create().toString(),
            is_user: false,
            message: 'test auto',
            timestamp: new Date()
        });

        expect(imHelper.isImForUser(imOther, judgeProfile.username, adminProfile)).toBeFalsy();
    });

    it('should return true when message is sent from admin to participant A logged in as participant A', () => {
        message = new InstantMessage({
            conferenceId: conference.id,
            from: adminUsername,
            from_display_name: adminProfile.display_name,
            to: judgeUsername,
            id: Guid.create().toString(),
            is_user: false,
            message: 'test auto',
            timestamp: new Date()
        });

        expect(imHelper.isImForUser(message, null, judgeProfile)).toBeTruthy();
    });

    it('should return false when message is sent from admin to participant B but logged in as Participant A', () => {
        const nonChatUser = new UserProfileResponse({
            display_name: 'Test Rep',
            first_name: 'Test',
            last_name: 'Rep',
            role: Role.Representative,
            username: 'rep@test.com'
        });
        message = new InstantMessage({
            conferenceId: conference.id,
            from: adminUsername,
            from_display_name: adminProfile.display_name,
            to: judgeUsername,
            id: Guid.create().toString(),
            is_user: false,
            message: 'test auto',
            timestamp: new Date()
        });

        expect(imHelper.isImForUser(message, null, nonChatUser)).toBeFalsy();
    });
});
