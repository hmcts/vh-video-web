import { Guid } from 'guid-typescript';
import * as moment from 'moment';
import {
    ConferenceForUserResponse,
    ConferenceForVhOfficerResponse,
    ConferenceResponse,
    ConferenceStatus,
    ParticipantForUserResponse,
    ParticipantResponse,
    ParticipantStatus,
    SelfTestPexipResponse,
    TaskResponse,
    TaskType,
    TaskUserResponse,
    UserRole
} from 'src/app/services/clients/api-client';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { AlertFilter, AlertsStatus, HearingsFilter, ListFilter, StatusFilter } from '../../../shared/models/hearings-filter';

export class ConferenceTestData {
    getConferenceNow(): ConferenceForUserResponse {
        const currentDateTime = new Date();
        const conference = new ConferenceForUserResponse({
            id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC4',
            case_name: 'C V I',
            case_number: '123ABC',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: currentDateTime,
            no_of_participants_available: 2,
            no_of_participants_unavailable: 1,
            no_of_participants_in_consultation: 2,
            scheduled_duration: 50,
            status: ConferenceStatus.NotStarted,
            participants: this.getListOfParticipants(),
            hearing_venue_name: 'Birmingham'
        });

        return conference;
    }

    getConferencePast(): ConferenceForUserResponse {
        const pastDate = new Date(new Date().getTime());
        pastDate.setUTCHours(pastDate.getUTCHours() - 26);
        const conference = new ConferenceForUserResponse({
            id: '58CB20C7-377D-4581-8069-3776F583684B',
            case_name: 'BW V BP',
            case_number: 'ABC1234',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: pastDate,
            no_of_participants_available: 2,
            no_of_participants_unavailable: 1,
            no_of_participants_in_consultation: 2,
            scheduled_duration: 50,
            status: ConferenceStatus.NotStarted,
            participants: this.getListOfParticipants()
        });
        return conference;
    }

    getConferenceFuture(): ConferenceForVhOfficerResponse {
        const futureDate = new Date(new Date().getTime());
        futureDate.setUTCHours(futureDate.getUTCHours() + 26);
        const conference = new ConferenceForVhOfficerResponse({
            id: '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
            case_name: 'WM V T',
            case_number: '0987UDIHH',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: futureDate,
            no_of_participants_available: 2,
            no_of_participants_unavailable: 1,
            no_of_participants_in_consultation: 2,
            scheduled_duration: 50,
            status: ConferenceStatus.NotStarted,
            participants: this.getListOfParticipants(),
            hearing_venue_name: 'Manchester',
            number_of_unread_messages: 4,
            no_of_pending_tasks: 3
        });
        return conference;
    }

    getTestData(): Array<ConferenceForUserResponse> {
        const testData: Array<ConferenceForUserResponse> = [];
        const conference1 = this.getConferenceNow();
        const conference2 = this.getConferencePast();
        const conference3 = this.getConferenceFuture();
        testData.push(conference1);
        testData.push(conference2);
        testData.push(conference3);
        return testData;
    }

    getVhoTestData(): Array<ConferenceForVhOfficerResponse> {
        const testData: Array<ConferenceForVhOfficerResponse> = [];
        const conference1 = this.getConferenceNow();
        const conference2 = this.getConferencePast();
        const conference3 = this.getConferenceFuture();
        testData.push(conference1);
        testData.push(conference2);
        testData.push(conference3);
        return testData;
    }

    getTestDataForFilter(): Array<ConferenceForUserResponse> {
        const testData: Array<ConferenceForUserResponse> = [];
        const task1 = new TaskUserResponse({ id: 1, body: 'Disconnected' });
        const task2 = new TaskUserResponse({ id: 2, body: 'Failed self-test (Bad Score)' });
        const conference1 = this.getConferenceNow();
        const conference2 = this.getConferenceNow();
        conference2.status = ConferenceStatus.InSession;
        conference2.hearing_venue_name = 'Manchester';
        conference2.tasks = [];
        conference2.tasks.push(task1);
        conference2.tasks.push(task2);

        const conference3 = this.getConferenceNow();
        conference3.status = ConferenceStatus.InSession;
        conference3.hearing_venue_name = 'Manchester';
        conference3.tasks = [];
        conference3.tasks.push(task2);

        testData.push(conference1);
        testData.push(conference2);
        testData.push(conference3);
        return testData;
    }

    getConferenceDetailFuture(): ConferenceResponse {
        const futureDate = new Date(new Date().toUTCString());
        futureDate.setUTCHours(futureDate.getUTCHours() + 26);
        return this.initConferenceDetails(futureDate);
    }

    getConferenceDetailNow(): ConferenceResponse {
        const now = new Date(new Date().toUTCString());
        return this.initConferenceDetails(now);
    }

    getConferenceDetailPast(): ConferenceResponse {
        const date = new Date(new Date().toUTCString());
        date.setUTCHours(date.getUTCHours() - 26);
        return this.initConferenceDetails(date);
    }

    private initConferenceDetails(scheduledDateTime): ConferenceResponse {
        const participants = this.getListOfParticipantDetails();
        const conference = new ConferenceResponse({
            id: '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
            case_name: 'WM V T',
            case_number: '0987UDIHH',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: scheduledDateTime,
            scheduled_duration: 45,
            status: ConferenceStatus.NotStarted,
            participants: participants,
            admin_i_frame_uri: 'adminiframe@kinly..com',
            judge_i_frame_uri: 'judgeiframe@kinly..com',
            participant_uri: 'participant@kinly..com',
            pexip_node_uri: 'node@kinly..com'
        });

        return conference;
    }

    getListOfParticipants(): ParticipantForUserResponse[] {
        const participants: ParticipantForUserResponse[] = [];

        const participant1 = new ParticipantForUserResponse({
            status: ParticipantStatus.Available,
            display_name: 'C Green',
            username: 'chris.green@hearings.net',
            role: UserRole.Representative,
            representee: 'James Green',
            case_type_group: 'applicant'
        });

        const participant2 = new ParticipantForUserResponse({
            status: ParticipantStatus.NotSignedIn,
            display_name: 'J Green',
            username: 'james.green@hearings.net',
            role: UserRole.Individual,
            case_type_group: 'applicant'
        });

        const participant3 = new ParticipantForUserResponse({
            status: ParticipantStatus.Available,
            display_name: 'Judge Fudge',
            username: 'judge.fudge@hearings.net',
            role: UserRole.Judge,
            case_type_group: 'judge'
        });

        const participant4 = new ParticipantForUserResponse({
            status: ParticipantStatus.Available,
            display_name: 'J Doe',
            username: 'john.doe@hearings.net',
            role: UserRole.Representative,
            representee: 'J Doe',
            case_type_group: 'respondent'
        });

        const participant5 = new ParticipantForUserResponse({
            status: ParticipantStatus.NotSignedIn,
            display_name: 'J Doe',
            username: 'jane.doe@hearings.net',
            role: UserRole.Individual,
            case_type_group: 'respondent'
        });

        participants.push(participant1);
        participants.push(participant2);
        participants.push(participant3);
        participants.push(participant4);
        participants.push(participant5);
        return participants;
    }

    getListOfParticipantDetails(): ParticipantResponse[] {
        const participants: ParticipantResponse[] = [];
        const participant1 = new ParticipantResponse({
            id: '9F681318-4955-49AF-A887-DED64554429D',
            contact_email: 'chris@green.com',
            first_name: 'Chris',
            last_name: 'Green',
            contact_telephone: '0123456780',
            name: 'Mr Chris Green',
            status: ParticipantStatus.Available,
            role: UserRole.Individual,
            case_type_group: 'Defendent',
            display_name: 'Greeno',
            username: 'chris.green@hearings.net',
            tiled_display_name: 'T1;Greeno;9F681318-4955-49AF-A887-DED64554429D'
        });

        const participant2 = new ParticipantResponse({
            id: '9F681318-4955-49AF-A887-DED64554429J',
            contact_email: 'james@green.com',
            first_name: 'James',
            last_name: 'Green',
            contact_telephone: '0123456781',
            name: 'Mr James Green',
            representee: 'Chris Green',
            status: ParticipantStatus.NotSignedIn,
            role: UserRole.Representative,
            display_name: 'James Green',
            case_type_group: 'Defendent',
            username: 'james.green@hearings.net',
            tiled_display_name: 'T2;James Green;9F681318-4955-49AF-A887-DED64554429J'
        });

        const participant3 = new ParticipantResponse({
            id: '9F681318-4955-49AF-A887-DED64554429T',
            contact_email: 'judge@kinly.com',
            first_name: 'Jeff',
            last_name: 'Kinly',
            contact_telephone: '01235468791',
            name: 'Judge Fudge',
            status: ParticipantStatus.Available,
            role: UserRole.Judge,
            display_name: 'Judge Fudge',
            username: 'judge.fudge@hearings.net',
            case_type_group: 'Judge',
            tiled_display_name: 'T0;Judge Fudge;9F681318-4955-49AF-A887-DED64554429T'
        });

        participants.push(participant1);
        participants.push(participant2);
        participants.push(participant3);
        return participants;
    }

    getTasksForConference(): TaskResponse[] {
        const task = new TaskResponse({
            body: 'body',
            type: TaskType.Participant,
            created: new Date()
        });
        const task1 = new TaskResponse({
            body: 'Disconnected',
            type: TaskType.Participant,
            created: new Date()
        });
        const tasks: TaskResponse[] = [];
        tasks.push(task);
        tasks.push(task1);
        return tasks;
    }

    getPexipConfig(): SelfTestPexipResponse {
        const pexipConfig = new SelfTestPexipResponse({
            pexip_self_test_node: 'sip.dev.self-test.hearings.hmcts.net'
        });
        return pexipConfig;
    }

    getHearingsFilter(): HearingsFilter {
        const filter = new HearingsFilter();
        filter.statuses.push(new StatusFilter('In Session', ConferenceStatus.InSession, false));
        filter.statuses.push(new StatusFilter('Not started', ConferenceStatus.NotStarted, false));

        filter.locations.push(new ListFilter('Birmingham', false));
        filter.locations.push(new ListFilter('Manchester', false));

        filter.alerts.push(new AlertFilter('Disconnected', AlertsStatus.Disconnected, 'Disconnected', false));
        filter.alerts.push(new AlertFilter('Self-test failed', AlertsStatus.FailedSelfTest, 'self-test', false));
        return filter;
    }

    getChatHistory(loggedInUser: string, conferenceId: string): InstantMessage[] {
        const now = new Date();
        const messages: InstantMessage[] = [];
        const message1 = new InstantMessage({
            conferenceId,
            id: Guid.create().toString(),
            from: 'vho.user@hearings.net',
            message: 'test message from vho',
            timestamp: moment(now)
                .subtract(3, 'minutes')
                .toDate()
        });

        const message2 = new InstantMessage({
            conferenceId,
            id: Guid.create().toString(),
            from: 'judge.fudge@hearings.net',
            message: 'test message from judge',
            timestamp: moment(now)
                .subtract(5, 'minutes')
                .toDate()
        });

        const message3 = new InstantMessage({
            conferenceId,
            id: Guid.create().toString(),
            from: 'vho.user@hearings.net',
            message: 'test message from vho 2',
            timestamp: moment(now)
                .subtract(8, 'minutes')
                .toDate()
        });

        const message4 = new InstantMessage({
            conferenceId,
            id: Guid.create().toString(),
            from: 'vho.user@hearings.net',
            message: 'test message from vho 3',
            timestamp: moment(now)
                .subtract(10, 'minutes')
                .toDate()
        });

        messages.push(message1);
        messages.push(message2);
        messages.push(message3);
        messages.push(message4);
        messages.forEach(m => {
            m.is_user = m.from.toLocaleLowerCase() === loggedInUser.toLocaleLowerCase();
        });
        return messages;
    }
}
