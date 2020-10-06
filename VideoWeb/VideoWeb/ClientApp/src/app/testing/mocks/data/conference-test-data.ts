import { builder } from '@testpossessed/ts-data-builder';
import { Guid } from 'guid-typescript';
import * as moment from 'moment';
import {
    ConferenceForVhOfficerResponse,
    ConferenceResponse,
    ConferenceResponseVho,
    ConferenceStatus,
    EndpointStatus,
    ParticipantContactDetailsResponseVho,
    ParticipantForUserResponse,
    ParticipantHeartbeatResponse,
    ParticipantResponseVho,
    ParticipantStatus,
    Role,
    SelfTestPexipResponse,
    TaskResponse,
    TaskType,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { AlertFilter, AlertsStatus, HearingsFilter, StatusFilter } from '../../../shared/models/hearings-filter';

export class ConferenceTestData {
    asConferenceResponseVho(confResponse: ConferenceResponse): ConferenceResponseVho {
        confResponse.endpoints = undefined;
        return new ConferenceResponseVho(confResponse);
    }

    getConferenceNow(): ConferenceForVhOfficerResponse {
        const currentDateTime = new Date();
        const conference = new ConferenceForVhOfficerResponse({
            id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC4',
            case_name: 'C V I',
            case_number: '123ABC',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: currentDateTime,
            scheduled_duration: 50,
            status: ConferenceStatus.NotStarted,
            participants: this.getListOfParticipants(),
            hearing_venue_name: 'Birmingham'
        });

        return conference;
    }

    getConferencePast(): ConferenceForVhOfficerResponse {
        const pastDate = new Date(new Date().getTime());
        pastDate.setUTCHours(pastDate.getUTCHours() - 26);
        const conference = new ConferenceForVhOfficerResponse({
            id: '58CB20C7-377D-4581-8069-3776F583684B',
            case_name: 'BW V BP',
            case_number: 'ABC1234',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: pastDate,
            scheduled_duration: 50,
            status: ConferenceStatus.NotStarted,
            participants: this.getListOfParticipants()
        });
        return conference;
    }

    getVHOConferencePast(): ConferenceForVhOfficerResponse {
        const pastDate = new Date(new Date().getTime());
        pastDate.setUTCHours(pastDate.getUTCHours() - 26);
        const conference = new ConferenceForVhOfficerResponse({
            id: '58CB20C7-377D-4581-8069-3776F583684B',
            case_name: 'BW V BP',
            case_number: 'ABC1234',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: pastDate,
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
            scheduled_duration: 50,
            status: ConferenceStatus.NotStarted,
            participants: this.getListOfParticipants(),
            hearing_venue_name: 'Manchester',
            started_date_time: null,
            closed_date_time: null
        });
        return conference;
    }

    getConferenceInSession(): ConferenceForVhOfficerResponse {
        const futureDate = new Date(new Date().getTime());
        futureDate.setUTCHours(futureDate.getUTCHours() + 26);
        const conference = new ConferenceForVhOfficerResponse({
            id: '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
            case_name: 'WM V T',
            case_number: '0987UDIHH',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: futureDate,
            scheduled_duration: 50,
            status: ConferenceStatus.NotStarted,
            participants: this.getListOfParticipants(),
            hearing_venue_name: 'Manchester',
            started_date_time: futureDate,
            closed_date_time: null
        });
        return conference;
    }

    getTestData(): Array<ConferenceForVhOfficerResponse> {
        const testData: Array<ConferenceForVhOfficerResponse> = [];
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

    getTestDataForFilter(): Array<ConferenceForVhOfficerResponse> {
        const testData: Array<ConferenceForVhOfficerResponse> = [];
        const conference1 = this.getConferenceNow();
        const conference2 = this.getConferenceNow();
        conference2.status = ConferenceStatus.InSession;
        conference2.hearing_venue_name = 'Manchester';

        const conference3 = this.getConferenceNow();
        conference3.status = ConferenceStatus.InSession;
        conference3.hearing_venue_name = 'Manchester';

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
            participant_uri: 'participant@kinly.com',
            pexip_node_uri: 'node@kinly.com',
            hearing_venue_name: 'venue name',
            endpoints: this.getListOfEndpoints()
        });

        return conference;
    }

    getListOfParticipants(): ParticipantForUserResponse[] {
        const participants: ParticipantForUserResponse[] = [];

        const participant1 = new ParticipantForUserResponse({
            id: '1111-1111-1111-1111',
            status: ParticipantStatus.Available,
            display_name: 'C Green',
            username: 'chris.green@hearings.net',
            role: Role.Representative,
            representee: 'James Green',
            case_type_group: 'applicant',
            tiled_display_name: 'T4;Mr Chris Green;1111-1111-1111-1111'
        });

        const participant2 = new ParticipantForUserResponse({
            id: '2222-2222-2222-2222',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'J Green',
            username: 'james.green@hearings.net',
            role: Role.Individual,
            case_type_group: 'applicant',
            tiled_display_name: 'T2;J Green;2222-2222-2222-2222'
        });

        const participant3 = new ParticipantForUserResponse({
            id: '3333-3333-3333-3333',
            status: ParticipantStatus.Available,
            display_name: 'Judge Fudge',
            username: 'judge.fudge@hearings.net',
            role: Role.Judge,
            case_type_group: 'judge',
            first_name: 'judge',
            last_name: 'fudge',
            tiled_display_name: 'T1;Judge Fudge;3333-3333-3333-3333'
        });

        const participant4 = new ParticipantForUserResponse({
            id: '4444-4444-4444-4444',
            status: ParticipantStatus.Available,
            display_name: 'J Doe',
            username: 'john.doe@hearings.net',
            role: Role.Representative,
            representee: 'J Doe',
            case_type_group: 'respondent',
            tiled_display_name: 'T4;J Doe;4444-4444-4444-4444'
        });

        const participant5 = new ParticipantForUserResponse({
            id: '5555-5555-5555-5555',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'J Doe',
            username: 'jane.doe@hearings.net',
            role: Role.Individual,
            case_type_group: 'respondent',
            tiled_display_name: 'T5;Ms J Doe;5555-5555-5555-5555'
        });

        const participant6 = new ParticipantForUserResponse({
            id: '6666-6666-6666-6666',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'Observer Doe O',
            username: 'observer.doe.O@hearings.net',
            role: Role.Individual,
            case_type_group: 'observer',
            tiled_display_name: 'T6;Observer Doe O;6666-6666-6666-6666'
        });

        const participant7 = new ParticipantForUserResponse({
            id: '7777-7777-7777-7777',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'Panel Mem Doe PM',
            username: 'panelmem.doe.PM@hearings.net',
            role: Role.Individual,
            case_type_group: 'panelmember',
            tiled_display_name: 'T7;Panel Mem Doe PM;7777-7777-7777-7777'
        });

        participants.push(participant1);
        participants.push(participant2);
        participants.push(participant3);
        participants.push(participant4);
        participants.push(participant5);
        participants.push(participant6);
        participants.push(participant7);
        return participants;
    }

    getListOfParticipantDetails(): ParticipantResponseVho[] {
        const participants: ParticipantResponseVho[] = [];
        const participant1 = new ParticipantResponseVho({
            id: '9F681318-4955-49AF-A887-DED64554429D',
            name: 'Mr Chris Green',
            status: ParticipantStatus.Available,
            role: Role.Individual,
            case_type_group: 'Defendent',
            display_name: 'Greeno',
            username: 'chris.green@hearings.net',
            tiled_display_name: 'T1;Greeno;9F681318-4955-49AF-A887-DED64554429D'
        });

        const participant2 = new ParticipantResponseVho({
            id: '9F681318-4955-49AF-A887-DED64554429J',
            name: 'Mr James Green',
            representee: 'Chris Green',
            status: ParticipantStatus.NotSignedIn,
            role: Role.Representative,
            display_name: 'James Green',
            case_type_group: 'Defendent',
            username: 'james.green@hearings.net',
            tiled_display_name: 'T2;James Green;9F681318-4955-49AF-A887-DED64554429J'
        });

        const participant3 = new ParticipantResponseVho({
            id: '9F681318-4955-49AF-A887-DED64554429T',
            name: 'Judge Fudge',
            status: ParticipantStatus.Available,
            role: Role.Judge,
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

    getListOParticipantContactDetailsResponseVho(conferenceId: string, hearingVenueName: string): ParticipantContactDetailsResponseVho[] {
        const participants: ParticipantContactDetailsResponseVho[] = [];
        const participant1 = new ParticipantContactDetailsResponseVho({
            id: '9F681318-4955-49AF-A887-DED64554429D',
            name: 'Mr Chris Green',
            status: ParticipantStatus.Available,
            role: Role.Individual,
            case_type_group: 'Defendent',
            display_name: 'Greeno',
            username: 'chris.green@hearings.net',
            conference_id: conferenceId,
            hearing_venue_name: hearingVenueName,
            contact_email: 'chris.green@hearings.net',
            contact_telephone: '123',
            first_name: 'Chris',
            last_name: 'Green',
            ref_id: 'B505FA9D-8072-4F96-8CA6-4F0489DD6E08'
        });

        const participant2 = new ParticipantContactDetailsResponseVho({
            id: '9F681318-4955-49AF-A887-DED64554429J',
            name: 'Mr James Green',
            status: ParticipantStatus.NotSignedIn,
            role: Role.Representative,
            display_name: 'James Green',
            case_type_group: 'Defendent',
            username: 'james.green@hearings.net',
            conference_id: conferenceId,
            hearing_venue_name: hearingVenueName,
            contact_email: 'james.green@hearings.net',
            contact_telephone: '456',
            first_name: 'James',
            last_name: 'Green',
            ref_id: '072D80ED-6816-42AF-A0C0-2FAE0F65E17A'
        });

        const participant3 = new ParticipantContactDetailsResponseVho({
            id: '9F681318-4955-49AF-A887-DED64554429T',
            name: 'Judge Fudge',
            status: ParticipantStatus.Available,
            role: Role.Judge,
            display_name: 'Judge Fudge',
            username: 'judge.fudge@hearings.net',
            case_type_group: 'Judge',
            conference_id: conferenceId,
            hearing_venue_name: hearingVenueName,
            contact_email: 'judge.fudge@hearings.net',
            contact_telephone: '789',
            first_name: 'Judge',
            last_name: 'Fudge',
            ref_id: '9B4737C9-5D8A-4B67-8569-EF8185FFE6E3',
            judge_in_another_hearing: true
        });

        const participant4 = new ParticipantContactDetailsResponseVho({
            id: '9D13E6A4-035F-47B3-9F5E-72FD2F2E0DFD',
            name: 'Judge Fudge',
            status: ParticipantStatus.Available,
            role: Role.Judge,
            display_name: 'Judge Fudge',
            username: 'judge.fudge@hearings.net',
            case_type_group: 'Judge',
            conference_id: '6D4F28D0-0638-48F7-9C34-18221C3F87F2',
            hearing_venue_name: hearingVenueName,
            contact_email: 'judge.fudge@hearings.net',
            contact_telephone: '910',
            first_name: 'Judge',
            last_name: 'Fudge',
            ref_id: '9B4737C9-5D8A-4B67-8569-EF8185FFE6E3'
        });

        participants.push(participant1);
        participants.push(participant2);
        participants.push(participant3);
        participants.push(participant4);
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

        filter.alerts.push(new AlertFilter('Disconnected', AlertsStatus.Disconnected, 'Disconnected', false));
        filter.alerts.push(new AlertFilter('Self-test failed', AlertsStatus.FailedSelfTest, 'self-test', false));
        return filter;
    }

    getChatHistory(loggedInUser: string, conferenceId: string): InstantMessage[] {
        const adminUsername = 'vho.user@hearings.net';
        const adminDisplayName = 'VHO user';
        const judgeUsername = 'judge.fudge@hearings.net';
        const judgeDisplayName = 'Judge Fudge';

        const now = new Date();
        const messages: InstantMessage[] = [];
        const message1 = new InstantMessage({
            conferenceId,
            id: Guid.create().toString(),
            from: adminUsername,
            to: judgeUsername,
            from_display_name: adminDisplayName,
            message: 'test message from vho',
            timestamp: moment(now).subtract(3, 'minutes').toDate()
        });

        const message2 = new InstantMessage({
            conferenceId,
            id: Guid.create().toString(),
            from: judgeUsername,
            to: adminUsername,
            from_display_name: judgeDisplayName,
            message: 'test message from judge',
            timestamp: moment(now).subtract(5, 'minutes').toDate()
        });

        const message3 = new InstantMessage({
            conferenceId,
            id: Guid.create().toString(),
            from: adminUsername,
            to: judgeUsername,
            from_display_name: adminUsername,
            message: 'test message from vho 2',
            timestamp: moment(now).subtract(8, 'minutes').toDate()
        });

        const message4 = new InstantMessage({
            conferenceId,
            id: Guid.create().toString(),
            from: adminUsername,
            to: judgeUsername,
            from_display_name: adminUsername,
            message: 'test message from vho 3',
            timestamp: moment(now).subtract(10, 'minutes').toDate()
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

    getParticipantHeartbeatResponse() {
        return builder
            .createListOfSize<ParticipantHeartbeatResponse>(3)
            .with((h, i) => (h.timestamp = new Date()))
            .with((h, i) => (h.browser_name = 'Chrome'))
            .with((h, i) => (h.browser_version = '84.1.0'))
            .with((h, i) => (h.recent_packet_loss = 4))
            .build();
    }

    getListOfParticipantsObserverAndPanelMembers(): ParticipantResponseVho[] {
        const participants: ParticipantResponseVho[] = [];
        const participant1 = new ParticipantResponseVho({
            id: 'abd18c35-884d-430e-9569-415cafe30afb',
            name: 'Observer Test 1',
            status: ParticipantStatus.Available,
            role: Role.Individual,
            case_type_group: 'Observer',
            display_name: 'Greeno',
            username: 'ob1@hearings.net',
            tiled_display_name: 'T100;Observer Test 1;abd18c35-884d-430e-9569-415cafe30afb'
        });

        const participant2 = new ParticipantResponseVho({
            id: '2ccddb9f-887c-47f9-82b3-896eec0a2595',
            name: 'Observer Test 2',
            representee: 'Chris Green',
            status: ParticipantStatus.NotSignedIn,
            role: Role.Individual,
            display_name: 'James Green',
            case_type_group: 'Observer',
            username: 'ob2@hearings.net',
            tiled_display_name: 'T101;Observer Test 2;2ccddb9f-887c-47f9-82b3-896eec0a2595'
        });

        const participant3 = new ParticipantResponseVho({
            id: 'e698a672-8925-46e6-907d-21f1bc3b8bbf',
            name: 'Panel Mem 1',
            status: ParticipantStatus.Available,
            role: Role.Individual,
            display_name: 'Panel Mem 1',
            username: 'pm.1@hearings.net',
            case_type_group: 'PanelMember',
            tiled_display_name: 'T102;Panel Mem 1;e698a672-8925-46e6-907d-21f1bc3b8bbf'
        });

        participants.push(participant1);
        participants.push(participant2);
        participants.push(participant3);
        return participants;
    }

    getListOfEndpoints(): VideoEndpointResponse[] {
        const endpoints: VideoEndpointResponse[] = [];
        const point1 = new VideoEndpointResponse({
            display_name: 'DispName1',
            status: EndpointStatus.NotYetJoined,
            id: '1232323',
            pexip_display_name: 'T100;DispName1;1232323'
        });
        const point2 = new VideoEndpointResponse({
            display_name: 'DispName2',
            status: EndpointStatus.Connected,
            id: '123232355',
            defence_advocate_username: 'john.doe@hearings.net',
            pexip_display_name: 'T101;DispName2;123232355'
        });
        endpoints.push(point1);
        endpoints.push(point2);
        return endpoints;
    }
}
