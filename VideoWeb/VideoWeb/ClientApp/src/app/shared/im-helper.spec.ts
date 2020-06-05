import { profile } from 'console';
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

    it('should return true when user is admin', () => {
        expect(imHelper.isImForUser(message, hearing, adminProfile)).toBeTruthy();
    });

    it('should return true when user is in conference', () => {
        expect(imHelper.isImForUser(message, hearing, judgeProfile)).toBeTruthy();
    });
});
