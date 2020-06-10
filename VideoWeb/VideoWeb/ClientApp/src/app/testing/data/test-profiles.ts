import { Role, UserProfileResponse } from '../../services/clients/api-client';

export const judgeTestProfile: UserProfileResponse = new UserProfileResponse({
    display_name: 'Judge Fudge',
    first_name: 'Judge',
    last_name: 'Fudge',
    role: Role.Judge,
    username: 'judge.fudge@hearings.net'
});

export const adminTestProfile: UserProfileResponse = new UserProfileResponse({
    display_name: 'Test Admin',
    first_name: 'Test',
    last_name: 'Admin',
    role: Role.VideoHearingsOfficer,
    username: 'admin@test.com'
});
