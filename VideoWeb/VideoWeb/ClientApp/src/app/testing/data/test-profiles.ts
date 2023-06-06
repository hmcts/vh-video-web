import { Role, UserProfileResponse } from '../../services/clients/api-client';

export const judgeTestProfile: UserProfileResponse = new UserProfileResponse({
    display_name: 'Judge Fudge',
    first_name: 'Judge',
    last_name: 'Fudge',
    roles: [Role.Judge],
    username: 'judge.fudge@hearings.net'
});

export const adminTestProfile: UserProfileResponse = new UserProfileResponse({
    display_name: 'Test Admin',
    first_name: 'Test',
    last_name: 'Admin',
    roles: [Role.VideoHearingsOfficer],
    username: 'admin@hmcts.net'
});

export const individualTestProfile: UserProfileResponse = new UserProfileResponse({
    display_name: 'J Green',
    first_name: 'James',
    last_name: 'Green',
    roles: [Role.Individual],
    username: 'james.green@hearings.net'
});
