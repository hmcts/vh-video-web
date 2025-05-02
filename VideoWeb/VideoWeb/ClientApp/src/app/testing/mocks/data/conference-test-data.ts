import { builder } from '@testpossessed/ts-data-builder';
import { Guid } from 'guid-typescript';
import moment from 'moment';
import {
    ConferenceForHostResponse,
    ConferenceForVhOfficerResponse,
    ConferenceResponse,
    ConferenceStatus,
    EndpointStatus,
    InterpreterLanguageResponse,
    InterpreterType,
    LinkedParticipantResponse,
    LinkType,
    ParticipantContactDetailsResponseVho,
    ParticipantForUserResponse,
    ParticipantHeartbeatResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomSummaryResponse,
    SelfTestPexipResponse,
    Supplier,
    TaskResponse,
    TaskType,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { AlertFilter, AlertsStatus, HearingsFilter, StatusFilter } from '../../../shared/models/hearings-filter';

export class ConferenceTestData {
    quickLinkParticipant1 = new ParticipantForUserResponse({
        id: 'QuickLinkParticipant1_Id',
        status: ParticipantStatus.NotSignedIn,
        display_name: 'QuickLinkParticipant1_display_name',
        role: Role.QuickLinkParticipant,

        hearing_role: HearingRole.QUICK_LINK_PARTICIPANT,
        tiled_display_name: 'QuickLinkParticipant1_tiled_display_name',
        linked_participants: []
    });

    quickLinkParticipant2 = new ParticipantForUserResponse({
        id: 'QuickLinkParticipant2_Id',
        status: ParticipantStatus.NotSignedIn,
        display_name: 'QuickLinkParticipant2_display_name',
        role: Role.QuickLinkParticipant,

        hearing_role: HearingRole.QUICK_LINK_PARTICIPANT,
        tiled_display_name: 'QuickLinkParticipant2_tiled_display_name',
        linked_participants: []
    });

    asConferenceResponseVho(confResponse: ConferenceResponse): ConferenceResponse {
        confResponse.endpoints = undefined;
        return new ConferenceResponse(confResponse);
    }

    getConferenceNow(): ConferenceForVhOfficerResponse {
        const currentDateTime = new Date();
        return new ConferenceForVhOfficerResponse({
            id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC4',
            case_name: 'C V I',
            case_number: '123ABC',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: currentDateTime,
            scheduled_duration: 50,
            status: ConferenceStatus.NotStarted,
            participants: this.getListOfParticipants(),
            hearing_venue_name: 'Birmingham',
            allocated_cso: 'test cso'
        });
    }

    getConferenceForHostResponse(): ConferenceForHostResponse {
        return new ConferenceForHostResponse({
            id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC4',
            case_name: 'C V I',
            case_number: '123ABC',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: new Date(),
            scheduled_duration: 50,
            status: ConferenceStatus.NotStarted,
            participants: this.getListOfParticipants(),
            hearing_venue_is_scottish: true
        });
    }

    getConferencePast(): ConferenceForVhOfficerResponse {
        const pastDate = new Date(new Date().getTime());
        pastDate.setUTCHours(pastDate.getUTCHours() - 26);
        return new ConferenceForVhOfficerResponse({
            id: '58CB20C7-377D-4581-8069-3776F583684B',
            case_name: 'BW V BP',
            case_number: 'ABC1234',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: pastDate,
            scheduled_duration: 50,
            status: ConferenceStatus.NotStarted,
            hearing_venue_name: 'Manchester',
            participants: this.getListOfParticipants(),
            telephone_conference_id: '0345855',
            telephone_conference_numbers: '+441234567890',
            allocated_cso: 'test cso'
        });
    }

    getConferenceFuture(): ConferenceForVhOfficerResponse {
        const futureDate = new Date(new Date().getTime());
        futureDate.setUTCHours(futureDate.getUTCHours() + 26);
        return new ConferenceForVhOfficerResponse({
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
            closed_date_time: null,
            telephone_conference_id: '0345855',
            telephone_conference_numbers: '+441234567890,+440987654321',
            allocated_cso: 'test cso'
        });
    }

    getConferenceInSession(): ConferenceForVhOfficerResponse {
        const futureDate = new Date(new Date().getTime());
        futureDate.setUTCHours(futureDate.getUTCHours() + 26);
        return new ConferenceForVhOfficerResponse({
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
            closed_date_time: null,
            allocated_cso: 'test cso'
        });
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

    getListOfLinkedParticipants(isWitness: boolean = false): ParticipantForUserResponse[] {
        const participants: ParticipantForUserResponse[] = [];

        const id1 = Guid.create().toString();
        const id2 = Guid.create().toString();
        const room = new RoomSummaryResponse({ id: '123', label: 'Interpreter1', locked: false });
        if (isWitness) {
            room.id = '321';
            room.label = 'Interpreter2';
        }

        const participant1 = new ParticipantForUserResponse({
            id: id1,
            status: ParticipantStatus.NotSignedIn,
            display_name: 'Interpreter',
            role: Role.Individual,
            representee: null,

            tiled_display_name: `CIVILIAN;Interpreter;${id1}`,
            hearing_role: HearingRole.INTERPRETER,
            first_name: 'Interpreter',
            last_name: 'Doe',
            linked_participants: [new LinkedParticipantResponse({ link_type: LinkType.Interpreter, linked_id: id2 })]
        });

        const participant2 = new ParticipantForUserResponse({
            id: id2,
            status: ParticipantStatus.NotSignedIn,
            display_name: 'Interpretee',
            role: Role.Individual,
            representee: null,

            tiled_display_name: `CIVILIAN;Interpretee;${id2}`,
            hearing_role: HearingRole.LITIGANT_IN_PERSON,
            first_name: 'Interpretee',
            last_name: 'Doe',
            name: 'Interpretee',
            linked_participants: [new LinkedParticipantResponse({ link_type: LinkType.Interpreter, linked_id: id1 })],
            interpreter_room: room
        });

        if (isWitness) {
            participant1.display_name = 'Witness Interpreter';
            participant1.first_name = 'Witness Interpreter';
            participant1.tiled_display_name = `WITNESS;Interpretee;${id1}`;

            participant2.hearing_role = HearingRole.WITNESS;
            participant2.first_name = 'Witness Interpretee';
            participant2.display_name = 'Witness Interpretee';
            participant2.tiled_display_name = `WITNESS;Interpretee;${id2}`;
        }

        participants.push(participant1);
        participants.push(participant2);
        return participants;
    }

    getListOfExtraLinkedParticipants(isWitness: boolean = false): ParticipantForUserResponse[] {
        const participants: ParticipantForUserResponse[] = [];

        const id3 = Guid.create().toString();
        const id4 = Guid.create().toString();
        const room = new RoomSummaryResponse({ id: '321', label: 'Interpreter2', locked: false });

        const participant1 = new ParticipantForUserResponse({
            id: id3,
            status: ParticipantStatus.NotSignedIn,
            display_name: 'Interpreter 2',
            role: Role.Individual,
            representee: null,

            tiled_display_name: `CIVILIAN;Interpreter 2;${id3}`,
            hearing_role: HearingRole.INTERPRETER,
            first_name: 'Tim',
            last_name: 'Jones',
            linked_participants: [new LinkedParticipantResponse({ link_type: LinkType.Interpreter, linked_id: id4 })]
        });

        const participant2 = new ParticipantForUserResponse({
            id: id4,
            status: ParticipantStatus.NotSignedIn,
            display_name: 'Interpretee 2',
            role: Role.Individual,
            representee: null,

            tiled_display_name: `CIVILIAN;Interpretee 2;${id4}`,
            hearing_role: HearingRole.LITIGANT_IN_PERSON,
            first_name: 'Bob',
            last_name: 'Smith',
            linked_participants: [new LinkedParticipantResponse({ link_type: LinkType.Interpreter, linked_id: id3 })],
            interpreter_room: room
        });

        if (isWitness) {
            participant2.hearing_role = HearingRole.WITNESS;
            participant2.tiled_display_name = `WITNESS;Interpretee;${id4}`;
        }

        participants.push(participant1);
        participants.push(participant2);
        return participants;
    }

    getListOfParticipants(): ParticipantForUserResponse[] {
        const participants: ParticipantForUserResponse[] = [];
        const panelMemberRoom = new RoomSummaryResponse({ id: '234', label: 'PanelMember1', locked: false });

        const participant1 = new ParticipantForUserResponse({
            id: '1111-1111-1111-1111',
            status: ParticipantStatus.Available,
            display_name: 'C Green',
            role: Role.Representative,
            representee: 'James Green',

            tiled_display_name: 'CIVILIAN;Mr Chris Green;1111-1111-1111-1111',
            hearing_role: HearingRole.LITIGANT_IN_PERSON,
            linked_participants: []
        });

        const participant2 = new ParticipantForUserResponse({
            id: '2222-2222-2222-2222',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'J Green',
            role: Role.Individual,

            tiled_display_name: 'CIVILIAN;J Green;2222-2222-2222-2222',
            hearing_role: HearingRole.LITIGANT_IN_PERSON,
            linked_participants: []
        });

        const participant3 = new ParticipantForUserResponse({
            id: '3333-3333-3333-3333',
            status: ParticipantStatus.Available,
            display_name: 'Judge Fudge',
            role: Role.Judge,

            first_name: 'judge',
            last_name: 'fudge',
            tiled_display_name: 'JUDGE;Judge Fudge;3333-3333-3333-3333',
            hearing_role: HearingRole.JUDGE,
            linked_participants: []
        });

        const participant4 = new ParticipantForUserResponse({
            id: '4444-4444-4444-4444',
            status: ParticipantStatus.Available,
            display_name: 'J Doe',
            role: Role.Representative,
            representee: 'J Doe',

            tiled_display_name: 'CIVILIAN;J Doe;4444-4444-4444-4444',
            hearing_role: HearingRole.LITIGANT_IN_PERSON,
            linked_participants: []
        });

        const participant5 = new ParticipantForUserResponse({
            id: '5555-5555-5555-5555',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'J Doe',
            role: Role.Individual,

            tiled_display_name: 'CIVILIAN;Ms J Doe;5555-5555-5555-5555',
            hearing_role: HearingRole.LITIGANT_IN_PERSON,
            linked_participants: []
        });

        const participant6 = new ParticipantForUserResponse({
            id: '6666-6666-6666-6666',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'Observer Doe O',
            role: Role.Individual,

            tiled_display_name: 'CIVILIAN;Observer Doe O;6666-6666-6666-6666',
            hearing_role: HearingRole.OBSERVER,
            linked_participants: []
        });

        const participant7 = new ParticipantForUserResponse({
            id: '7777-7777-7777-7777',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'Panel Mem Doe PM',
            role: Role.JudicialOfficeHolder,

            hearing_role: HearingRole.PANEL_MEMBER,
            tiled_display_name: 'CIVILIAN;Panel Mem Doe PM;7777-7777-7777-7777',
            linked_participants: [],
            interpreter_room: panelMemberRoom
        });

        const participant8 = new ParticipantForUserResponse({
            id: '4545-4545-4545-4545',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'J Doe WINGER',
            role: Role.JudicialOfficeHolder,

            hearing_role: HearingRole.WINGER,
            linked_participants: [],
            interpreter_room: panelMemberRoom
        });

        const participant9 = new ParticipantForUserResponse({
            id: '7878-7878-7878-7878',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'J Doe WITNESS',
            role: Role.Individual,

            hearing_role: HearingRole.WITNESS,
            linked_participants: []
        });

        const participant10 = new ParticipantForUserResponse({
            id: '1234-1234-1234-1234',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'Staff Member Doe PM',
            role: Role.StaffMember,

            hearing_role: HearingRole.STAFF_MEMBER,
            tiled_display_name: 'Staff Member Doe PM;1234-1234-1234-1234',
            linked_participants: []
        });

        const participant11 = this.quickLinkParticipant2; // Out of order to test sorting
        const participant12 = this.quickLinkParticipant1;

        const participant13 = new ParticipantForUserResponse({
            id: 'QuickLinkObserver_Id',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'QuickLinkObserver_display_name',
            role: Role.QuickLinkObserver,

            hearing_role: HearingRole.QUICK_LINK_OBSERVER,
            tiled_display_name: 'QuickLinkParticipant_tiled_display_name',
            linked_participants: []
        });

        const participant14 = new ParticipantForUserResponse({
            id: '5555-1111-1234-1234',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'Medical Member',
            role: Role.JudicialOfficeHolder,

            hearing_role: HearingRole.MEDICAL_MEMBER,
            tiled_display_name: 'Medical Member;5555-1111-1234-1234',
            linked_participants: []
        });

        const participant15 = new ParticipantForUserResponse({
            id: '5555-1111-1234-1239',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'Lay Member',
            role: Role.JudicialOfficeHolder,

            hearing_role: HearingRole.LAY_MEMBER,
            tiled_display_name: 'Lay Member;5555-1111-1234-1239',
            linked_participants: []
        });

        participants.push(participant1);
        participants.push(participant2);
        participants.push(participant3);
        participants.push(participant4);
        participants.push(participant5);
        participants.push(participant6);
        participants.push(participant7);
        participants.push(participant8);
        participants.push(participant9);
        participants.push(participant10);
        participants.push(participant11);
        participants.push(participant12);
        participants.push(participant13);
        participants.push(participant14);
        participants.push(participant15);

        return participants;
    }

    getListOfParticipantDetails(): ParticipantResponse[] {
        const participants: ParticipantResponse[] = [];
        const participant1 = new ParticipantResponse({
            id: '9F681318-4955-49AF-A887-DED64554429D',
            name: 'Mr Chris Green',
            status: ParticipantStatus.Available,
            role: Role.Individual,

            display_name: 'Greeno',
            tiled_display_name: 'CIVILIAN;Greeno;9F681318-4955-49AF-A887-DED64554429D',
            hearing_role: HearingRole.LITIGANT_IN_PERSON,
            interpreter_language: new InterpreterLanguageResponse({
                code: 'spa',
                description: 'Spanish',
                type: InterpreterType.Verbal
            }),
            linked_participants: [],
            external_reference_id: 'B505FA9D-8072-4F96-8CA6-4F0489DD6E08',
            protect_from: []
        });

        const participant2 = new ParticipantResponse({
            id: '9F681318-4955-49AF-A887-DED64554429J',
            name: 'Mr James Green',
            representee: 'Chris Green',
            status: ParticipantStatus.NotSignedIn,
            role: Role.Representative,
            display_name: 'James Green',

            tiled_display_name: 'CIVILIAN;James Green;9F681318-4955-49AF-A887-DED64554429J',
            hearing_role: HearingRole.REPRESENTATIVE,
            linked_participants: [],
            external_reference_id: '072D80ED-6816-42AF-A0C0-2FAE0F65E17A',
            protect_from: []
        });

        const participant3 = new ParticipantResponse({
            id: '9F681318-4955-49AF-A887-DED64554429T',
            name: 'Judge Fudge',
            status: ParticipantStatus.Available,
            role: Role.Judge,
            display_name: 'Judge Fudge',

            tiled_display_name: 'JUDGE;Judge Fudge;9F681318-4955-49AF-A887-DED64554429T',
            hearing_role: HearingRole.JUDGE,
            linked_participants: [],
            external_reference_id: '9B4737C9-5D8A-4B67-8569-EF8185FFE6E3',
            protect_from: []
        });

        const participant4 = new ParticipantResponse({
            id: '9F681318-4965-49AF-A887-DED64554429T',
            name: 'Staff Member name',
            status: ParticipantStatus.Available,
            role: Role.StaffMember,
            display_name: 'Staff Member display name',

            tiled_display_name: 'Staff Member;Staff Member;9F681318-4965-49AF-A887-DED64554429T',
            hearing_role: HearingRole.STAFF_MEMBER,
            current_room: new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' }),
            linked_participants: [],
            external_reference_id: '9B4737C9-5D8A-4B67-8569-EF8185FFE6E3',
            protect_from: []
        });

        participants.push(participant1);
        participants.push(participant2);
        participants.push(participant3);
        participants.push(participant4);
        return participants;
    }

    getListOParticipantContactDetailsResponseVho(conferenceId: string, hearingVenueName: string): ParticipantContactDetailsResponseVho[] {
        const participants: ParticipantContactDetailsResponseVho[] = [];
        const participant1 = new ParticipantContactDetailsResponseVho({
            id: '9F681318-4955-49AF-A887-DED64554429D',
            name: 'Mr Chris Green',
            status: ParticipantStatus.Available,
            role: Role.Individual,

            display_name: 'Greeno',
            username: 'chris.green@hearings.net',
            conference_id: conferenceId,
            hearing_venue_name: hearingVenueName,
            contact_email: 'chris.green@hearings.net',
            contact_telephone: '123',
            first_name: 'Chris',
            last_name: 'Green',
            ref_id: 'B505FA9D-8072-4F96-8CA6-4F0489DD6E08',
            hearing_role: HearingRole.LITIGANT_IN_PERSON,
            linked_participants: []
        });

        const participant2 = new ParticipantContactDetailsResponseVho({
            id: '9F681318-4955-49AF-A887-DED64554429J',
            name: 'Mr James Green',
            status: ParticipantStatus.NotSignedIn,
            role: Role.Representative,
            display_name: 'James Green',

            username: 'james.green@hearings.net',
            conference_id: conferenceId,
            hearing_venue_name: hearingVenueName,
            contact_email: 'james.green@hearings.net',
            contact_telephone: '456',
            first_name: 'James',
            last_name: 'Green',
            ref_id: '072D80ED-6816-42AF-A0C0-2FAE0F65E17A',
            hearing_role: HearingRole.REPRESENTATIVE,
            linked_participants: []
        });

        const participant3 = new ParticipantContactDetailsResponseVho({
            id: '9F681318-4955-49AF-A887-DED64554429T',
            name: 'Judge Fudge',
            status: ParticipantStatus.Available,
            role: Role.Judge,
            display_name: 'Judge Fudge',
            username: 'judge.fudge@hearings.net',

            conference_id: conferenceId,
            hearing_venue_name: hearingVenueName,
            contact_email: 'judge.fudge@hearings.net',
            contact_telephone: '789',
            first_name: 'Judge',
            last_name: 'Fudge',
            ref_id: '9B4737C9-5D8A-4B67-8569-EF8185FFE6E3',
            host_in_another_hearing: true,
            hearing_role: HearingRole.JUDGE,
            linked_participants: []
        });

        const participant4 = new ParticipantContactDetailsResponseVho({
            id: '9D13E6A4-035F-47B3-9F5E-72FD2F2E0DFD',
            name: 'Judge Fudge',
            status: ParticipantStatus.Available,
            role: Role.Judge,
            display_name: 'Judge Fudge',
            username: 'judge.fudge@hearings.net',

            conference_id: '6D4F28D0-0638-48F7-9C34-18221C3F87F2',
            hearing_venue_name: hearingVenueName,
            contact_email: 'judge.fudge@hearings.net',
            contact_telephone: '910',
            first_name: 'Judge',
            last_name: 'Fudge',
            ref_id: '9B4737C9-5D8A-4B67-8569-EF8185FFE6E3',
            hearing_role: HearingRole.JUDGE,
            linked_participants: []
        });

        const participant5 = new ParticipantContactDetailsResponseVho({
            id: '9D13E6A4-035F-47B3-9F5E-72FD2F2E0DFF',
            name: 'Quick Link Participant Available',
            status: ParticipantStatus.Available,
            role: Role.QuickLinkParticipant,
            display_name: 'Quick Link Participant 1',
            username: 'ql1.pippo@hearings.net',

            conference_id: '6D4F28D0-0638-48F7-9C34-18221C3F87F2',
            hearing_venue_name: hearingVenueName,
            contact_email: 'ql1.pippo@hearings.net',
            contact_telephone: '910',
            first_name: 'Quick',
            last_name: 'Link 1',
            ref_id: '9B4737C9-5D8A-4B67-8569-EF8185FFE6E4',
            hearing_role: HearingRole.QUICK_LINK_PARTICIPANT,
            linked_participants: []
        });

        const participant6 = new ParticipantContactDetailsResponseVho({
            id: '9D13E6A4-035F-47B3-9F5E-72FD2F2E0DFG',
            name: 'Quick Link Participant Disconnected',
            status: ParticipantStatus.Disconnected,
            role: Role.QuickLinkParticipant,
            display_name: 'Quick Link Participant 2',
            username: 'ql1.pippo@hearings.net',

            conference_id: '6D4F28D0-0638-48F7-9C34-18221C3F87F2',
            hearing_venue_name: hearingVenueName,
            contact_email: 'ql2.pippo@hearings.net',
            contact_telephone: '910',
            first_name: 'Quick',
            last_name: 'Link 2',
            ref_id: '9B4737C9-5D8A-4B67-8569-EF8185FFE6E5',
            hearing_role: HearingRole.QUICK_LINK_PARTICIPANT,
            linked_participants: []
        });

        participants.push(participant1);
        participants.push(participant2);
        participants.push(participant3);
        participants.push(participant4);
        participants.push(participant5);
        participants.push(participant6);
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
        return new SelfTestPexipResponse({
            pexip_self_test_node: 'sip.dev.self-test.hearings.hmcts.net'
        });
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

    getListOfParticipantsObserverAndPanelMembers(): ParticipantResponse[] {
        const participants: ParticipantResponse[] = [];
        const participant1 = new ParticipantResponse({
            id: 'abd18c35-884d-430e-9569-415cafe30afb',
            name: 'Observer Test 1',
            status: ParticipantStatus.Available,
            role: Role.Individual,
            hearing_role: HearingRole.OBSERVER,

            display_name: 'Greeno',
            tiled_display_name: 'CIVILIAN;Observer Test 1;abd18c35-884d-430e-9569-415cafe30afb',
            linked_participants: []
        });

        const participant2 = new ParticipantResponse({
            id: '2ccddb9f-887c-47f9-82b3-896eec0a2595',
            name: 'Observer Test 2',
            representee: 'Chris Green',
            status: ParticipantStatus.NotSignedIn,
            role: Role.Individual,
            hearing_role: HearingRole.OBSERVER,
            display_name: 'James Green',

            tiled_display_name: 'CIVILIAN;Observer Test 2;2ccddb9f-887c-47f9-82b3-896eec0a2595',
            linked_participants: []
        });

        const participant3 = new ParticipantResponse({
            id: 'e698a672-8925-46e6-907d-21f1bc3b8bbf',
            name: 'Panel Mem 1',
            status: ParticipantStatus.Available,
            role: Role.JudicialOfficeHolder,
            hearing_role: HearingRole.PANEL_MEMBER,
            display_name: 'Panel Mem 1',

            tiled_display_name: 'CIVILIAN;Panel Mem 1;e698a672-8925-46e6-907d-21f1bc3b8bbf',
            linked_participants: []
        });

        participants.push(participant1);
        participants.push(participant2);
        participants.push(participant3);
        return participants;
    }

    getListOfParticipantsWingers(): ParticipantResponse[] {
        const participants: ParticipantResponse[] = [];
        const participant1 = new ParticipantResponse({
            id: 'c8c33015-d164-4a46-a5c9-6b58e892511b',
            name: 'Mr Chris Winger',
            status: ParticipantStatus.Available,
            role: Role.JudicialOfficeHolder,

            display_name: 'Chris Winger',
            tiled_display_name: 'CIVILIAN;Chris Winger;c8c33015-d164-4a46-a5c9-6b58e892511b',
            hearing_role: HearingRole.WINGER,
            linked_participants: []
        });
        participants.push(participant1);
        return participants;
    }

    getListOfParticipantsWitness(): ParticipantResponse[] {
        const participants: ParticipantResponse[] = [];
        const participant1 = new ParticipantResponse({
            id: 'c8c33015-d164-4a46-a5c9-6b58e892511a',
            name: 'Mr Chris Witness',
            status: ParticipantStatus.Available,
            role: Role.Individual,

            display_name: 'Chris Witness',
            tiled_display_name: 'WITNESS;Chris Witness;c8c33015-d164-4a46-a5c9-6b58e892511a',
            hearing_role: HearingRole.WITNESS,
            linked_participants: []
        });
        participants.push(participant1);
        return participants;
    }

    getListOfEndpoints(): VideoEndpointResponse[] {
        const endpoints: VideoEndpointResponse[] = [];
        const point1 = new VideoEndpointResponse({
            display_name: 'DispName1',
            status: EndpointStatus.NotYetJoined,
            id: '1232323',
            pexip_display_name: 'PSTN;DispName1;1232323'
        });
        const point2 = new VideoEndpointResponse({
            display_name: 'DispName2',
            status: EndpointStatus.InHearing,
            id: '123232355',
            participants_linked: ['john.doe@hearings.net'],
            pexip_display_name: 'PSTN;DispName2;123232355',
            interpreter_language: new InterpreterLanguageResponse({
                code: 'spa',
                description: 'Spanish',
                type: InterpreterType.Verbal
            })
        });
        endpoints.push(point1);
        endpoints.push(point2);
        return endpoints;
    }

    getFullListOfNonJudgeParticipants(): ParticipantResponse[] {
        const participants: ParticipantResponse[] = [];
        const participant1 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'Mr C Smith',
            first_name: null,
            hearing_role: 'Quick link participant',
            id: '72af1eac-9c38-4b7e-9c20-6ed00f36bd71',
            interpreter_room: undefined,
            last_name: null,
            linked_participants: [],
            name: 'Mr C Smith',
            representee: null,
            role: Role.QuickLinkParticipant,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'WITNESS;NO_HEARTBEAT;C;72af1eac-9c38-4b7e-9c20-6ed00f36bd71',
            user_name: '72af1eac-9c38-4b7e-9c20-6ed00f36bd71@quick-link-participant.com'
        });
        const participant2 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'Mr D Smith',
            first_name: null,
            hearing_role: 'Quick link participant',
            id: '0880354e-52b9-4804-8e45-969c11796a26',
            interpreter_room: undefined,
            last_name: null,
            linked_participants: [],
            name: 'Mr D Smith',
            representee: null,
            role: Role.QuickLinkParticipant,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'WITNESS;NO_HEARTBEAT;D;0880354e-52b9-4804-8e45-969c11796a26',
            user_name: '0880354e-52b9-4804-8e45-969c11796a26@quick-link-participant.com'
        });

        const participant4LinkedParticipants: LinkedParticipantResponse[] = [];
        participant4LinkedParticipants.push(
            new LinkedParticipantResponse({
                link_type: LinkType.Interpreter,
                linked_id: 'acf3b4c4-3e92-4937-b2b0-6e9d486efcd2'
            })
        );

        const participant4 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'B',
            first_name: 'B',
            hearing_role: 'Litigant in person',
            id: 'c2118eec-9e62-40bc-af60-0c5898ddec29',
            interpreter_room: undefined,
            last_name: 'Smith',
            linked_participants: participant4LinkedParticipants,
            name: 'Mr B Smith',
            representee: '',
            role: Role.Individual,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;B;c2118eec-9e62-40bc-af60-0c5898ddec29',
            user_name: 'applicant.litigant@hearings.reform.hmcts.net'
        });

        const participant5LinkedParticipants: LinkedParticipantResponse[] = [];
        participant5LinkedParticipants.push(
            new LinkedParticipantResponse({
                link_type: LinkType.Interpreter,
                linked_id: 'c2118eec-9e62-40bc-af60-0c5898ddec29'
            })
        );

        const participant5 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'A',
            first_name: 'A',
            hearing_role: 'Interpreter',
            id: 'acf3b4c4-3e92-4937-b2b0-6e9d486efcd2',
            interpreter_room: undefined,
            last_name: 'Smith',
            linked_participants: participant5LinkedParticipants,
            name: 'Mr A Smith',
            representee: '',
            role: Role.Individual,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;A;acf3b4c4-3e92-4937-b2b0-6e9d486efcd2',
            user_name: 'applicant.interpreter@hearings.reform.hmcts.net'
        });

        const participant6 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'G',
            first_name: 'G',
            hearing_role: 'Witness',
            id: 'adf3b4c4-3e92-4937-b2b0-6e9d486efcd2',
            interpreter_room: undefined,
            last_name: 'Smith',
            linked_participants: [],
            name: 'Mr G Smith',
            representee: '',
            role: Role.Individual,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;A;adf3b4c4-3e92-4937-b2b0-6e9d486efcd2',
            user_name: 'applicant.witness@hearings.reform.hmcts.net'
        });

        const participant7 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'E',
            first_name: 'E',
            hearing_role: 'Witness',
            id: '0136aee3-5330-4731-8be2-a05e10234d87',
            interpreter_room: undefined,
            last_name: 'Witness',
            linked_participants: [],
            name: 'Mr E Smith',
            representee: '',
            role: Role.Individual,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'WITNESS;NO_HEARTBEAT;F;0136aee3-5330-4731-8be2-a05e10234d87',
            user_name: 'respondent.witness1@hearings.reform.hmcts.net'
        });

        const participant8LinkedParticipants: LinkedParticipantResponse[] = [];
        participant8LinkedParticipants.push(
            new LinkedParticipantResponse({
                link_type: LinkType.Interpreter,
                linked_id: 'dcf3b4c4-3e92-4937-b2b0-6e9d486efcd3'
            })
        );

        const participant8 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'F',
            first_name: 'F',
            hearing_role: 'Litigant in person',
            id: 'db6eb25b-1d70-46ad-8b83-355922f8e976',
            interpreter_room: undefined,
            last_name: 'Smith',
            linked_participants: participant8LinkedParticipants,
            name: 'Mr F Smith',
            representee: '',
            role: Role.Individual,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;E;db6eb25b-1d70-46ad-8b83-355922f8e976',
            user_name: 'respondent.litigant@hearings.reform.hmcts.net'
        });

        const participant9LinkedParticipants: LinkedParticipantResponse[] = [];
        participant9LinkedParticipants.push(
            new LinkedParticipantResponse({
                link_type: LinkType.Interpreter,
                linked_id: 'db6eb25b-1d70-46ad-8b83-355922f8e976'
            })
        );

        const participant9 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'H',
            first_name: 'H',
            hearing_role: 'Interpreter',
            id: 'dcf3b4c4-3e92-4937-b2b0-6e9d486efcd3',
            interpreter_room: undefined,
            last_name: 'Smith',
            linked_participants: participant9LinkedParticipants,
            name: 'Mr H Smith',
            representee: '',
            role: Role.Individual,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;A;dcf3b4c4-3e92-4937-b2b0-6e9d486efcd3',
            user_name: 'respondent.interpreter@hearings.reform.hmcts.net'
        });

        participants.push(participant1);
        participants.push(participant2);
        participants.push(participant5);
        participants.push(participant6);
        participants.push(participant4);
        participants.push(participant7);
        participants.push(participant8);
        participants.push(participant9);
        return participants;
    }

    getFullListOfPanelMembers(): ParticipantResponse[] {
        const participants: ParticipantResponse[] = [];
        const participant1 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'Mr Panel Member B',
            first_name: 'Panel',
            hearing_role: 'Panel Member',
            id: 'c505165b-da2a-4a53-a17e-d8f6b0c82e26',
            interpreter_room: undefined,
            last_name: 'Member B',
            linked_participants: [],
            name: 'Mr Panel Member B',
            representee: '',
            role: Role.JudicialOfficeHolder,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;Mr Panel Member B;c505165b-da2a-4a53-a17e-d8f6b0c82e26',
            user_name: 'panel.memberb1@hearings.reform.hmcts.net'
        });
        const participant2 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'Mr Panel Member A',
            first_name: 'Panel',
            hearing_role: 'Panel Member',
            id: 'b3de9868-3275-4e2c-9e28-fcf4d9b7898d',
            interpreter_room: undefined,
            last_name: 'Member A',
            linked_participants: [],
            name: 'Mr Panel Member A',
            representee: '',
            role: Role.JudicialOfficeHolder,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;Mr Panel Member A;b3de9868-3275-4e2c-9e28-fcf4d9b7898d',
            user_name: 'panel.membera1@hearings.reform.hmcts.net'
        });

        participants.push(participant1);
        participants.push(participant2);
        return participants;
    }

    getFullListOfObservers(): ParticipantResponse[] {
        const observers: ParticipantResponse[] = [];
        const qlObserver1 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'QL Observer A',
            first_name: null,
            hearing_role: 'Quick link observer',
            id: 'f565e05c-01b2-4b3a-b2d8-1d79b5d4124c',
            interpreter_room: undefined,
            last_name: null,
            linked_participants: [],
            name: 'QL Observer A',
            representee: null,
            role: Role.QuickLinkObserver,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'WITNESS;NO_HEARTBEAT;QL Observer A;f565e05c-01b2-4b3a-b2d8-1d79b5d4124c',
            user_name: 'f565e05c-01b2-4b3a-b2d8-1d79b5d4124c@quick-link-participant.com'
        });
        const observer1 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'Mr Observer B',
            first_name: 'Observer',
            hearing_role: 'Observer',
            id: '3b0ae293-1979-4d07-8a3a-b95286e5f8c0',
            interpreter_room: undefined,
            last_name: 'B',
            linked_participants: [],
            name: 'Mr Observer B',
            representee: '',
            role: Role.Individual,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;Mr Observer B;3b0ae293-1979-4d07-8a3a-b95286e5f8c0',
            user_name: 'observer.b1@hearings.reform.hmcts.net'
        });
        const observer2 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'Mr Observer A',
            first_name: 'Observer',
            hearing_role: 'Observer',
            id: '68ca1dbf-5da9-4382-bf60-8a07124be329',
            interpreter_room: undefined,
            last_name: 'A',
            linked_participants: [],
            name: 'Mr Observer A',
            representee: '',
            role: Role.Individual,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;Mr Observer A;68ca1dbf-5da9-4382-bf60-8a07124be329',
            user_name: 'observer.a@hearings.reform.hmcts.net'
        });
        const qlObserver2 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'A QL Observer',
            first_name: null,
            hearing_role: 'Quick link observer',
            id: '5f9e380b-1412-4f70-9ea4-447a5f3ae184',
            interpreter_room: undefined,
            last_name: null,
            linked_participants: [],
            name: 'A QL Observer',
            representee: null,
            role: Role.QuickLinkObserver,
            status: ParticipantStatus.Joining,
            tiled_display_name: 'WITNESS;NO_HEARTBEAT;A QL Observer;5f9e380b-1412-4f70-9ea4-447a5f3ae184',
            user_name: '5f9e380b-1412-4f70-9ea4-447a5f3ae184@quick-link-participant.com'
        });

        observers.push(qlObserver1);
        observers.push(observer1);
        observers.push(observer2);
        observers.push(qlObserver2);
        return observers;
    }

    getFullListOfEndpoints(): VideoEndpointResponse[] {
        const endpoints: VideoEndpointResponse[] = [];
        const endpoint1 = new VideoEndpointResponse({
            current_room: undefined,
            participants_linked: null,
            display_name: 'Endpoint B',
            id: '73a94f6c-e17d-4ce9-bb25-35d7d7192d1a',
            is_current_user: false,
            pexip_display_name: 'PSTN;Endpoint B;73a94f6c-e17d-4ce9-bb25-35d7d7192d1a',
            status: EndpointStatus.NotYetJoined
        });
        const endpoint2 = new VideoEndpointResponse({
            current_room: undefined,
            participants_linked: null,
            display_name: 'Endpoint A',
            id: '9d7b9cde-3a48-4acb-9977-34e27667604d',
            is_current_user: false,
            pexip_display_name: 'PSTN;Endpoint A;9d7b9cde-3a48-4acb-9977-34e27667604d',
            status: EndpointStatus.NotYetJoined
        });

        endpoints.push(endpoint1);
        endpoints.push(endpoint2);
        return endpoints;
    }

    getFullListOfStaffMembers(): ParticipantResponse[] {
        const staffMembers: ParticipantResponse[] = [];
        const staffMember1 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'C StaffMember',
            first_name: 'C',
            hearing_role: 'Staff Member',
            id: 'ef04ef31-34a5-44ce-80b0-0c7fc2b85195',
            interpreter_room: undefined,
            last_name: 'StaffMember',
            linked_participants: [],
            name: 'C StaffMember',
            representee: null,
            role: Role.StaffMember,
            status: ParticipantStatus.Disconnected,
            tiled_display_name: 'CLERK;HEARTBEAT;C StaffMember;ef04ef31-34a5-44ce-80b0-0c7fc2b85195',
            user_name: 'c.staffmember@hearings.reform.hmcts.net'
        });
        const staffMember2 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'B StaffMember',
            first_name: 'B',
            hearing_role: 'Staff Member',
            id: '58a8d187-7041-4a3a-b455-4d3a8570e617',
            interpreter_room: undefined,
            last_name: 'StaffMember',
            linked_participants: [],
            name: 'B StaffMember',
            representee: null,
            role: Role.StaffMember,
            status: ParticipantStatus.Disconnected,
            tiled_display_name: 'CLERK;HEARTBEAT;B StaffMember;58a8d187-7041-4a3a-b455-4d3a8570e617',
            user_name: 'b.staffmember@hearings.reform.hmcts.net'
        });
        const staffMember3 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'A StaffMember',
            first_name: 'A',
            hearing_role: 'Staff Member',
            id: '976cce84-218e-4bb4-9c30-f469a389a9cd',
            interpreter_room: undefined,
            last_name: 'StaffMember',
            linked_participants: [],
            name: 'A StaffMember',
            representee: null,
            role: Role.StaffMember,
            status: ParticipantStatus.Disconnected,
            tiled_display_name: 'CLERK;HEARTBEAT;A StaffMember;976cce84-218e-4bb4-9c30-f469a389a9cd',
            user_name: 'a.staffmember@hearings.reform.hmcts.net'
        });

        staffMembers.push(staffMember1);
        staffMembers.push(staffMember2);
        staffMembers.push(staffMember3);
        return staffMembers;
    }

    getFullListOfWingers(): ParticipantResponse[] {
        const wingers: ParticipantResponse[] = [];
        const winger1 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'B Winger',
            first_name: 'B',
            hearing_role: 'Winger',
            id: '08584914-f944-4829-8ac7-6ed6c0870efb',
            interpreter_room: undefined,
            last_name: 'Winger',
            linked_participants: [],
            name: 'Mr B Winger',
            representee: '',
            role: Role.JudicialOfficeHolder,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;B Winger;08584914-f944-4829-8ac7-6ed6c0870efb',
            user_name: 'b.winger@hearings.reform.hmcts.net'
        });
        const winger2 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'A Winger',
            first_name: 'A',
            hearing_role: 'Winger',
            id: '42c7abd6-b778-4f20-94e1-8517bf30d7f2',
            interpreter_room: undefined,
            last_name: 'Winger',
            linked_participants: [],
            name: 'Mr A Winger',
            representee: '',
            role: Role.JudicialOfficeHolder,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;A Winger;42c7abd6-b778-4f20-94e1-8517bf30d7f2',
            user_name: 'a.winger1@hearings.reform.hmcts.net'
        });
        const winger3 = new ParticipantResponse({
            current_room: undefined,
            display_name: 'C Winger',
            first_name: 'C',
            hearing_role: 'Winger',
            id: '6fa27d52-c94a-4d94-9dd4-f3a52f6e5f38',
            interpreter_room: undefined,
            last_name: 'Winger',
            linked_participants: [],
            name: 'Mr C Winger',
            representee: '',
            role: Role.JudicialOfficeHolder,
            status: ParticipantStatus.NotSignedIn,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;C Winger;6fa27d52-c94a-4d94-9dd4-f3a52f6e5f38',
            user_name: 'c.winger@hearings.reform.hmcts.net'
        });

        wingers.push(winger1);
        wingers.push(winger2);
        wingers.push(winger3);
        return wingers;
    }

    getInterpreterLanguageResponse(): InterpreterLanguageResponse[] {
        return [
            new InterpreterLanguageResponse({
                code: 'afr',
                description: 'Afrikaans',
                type: InterpreterType.Verbal
            }),
            new InterpreterLanguageResponse({
                code: 'ase',
                description: 'American Sign Language (ASL)',
                type: InterpreterType.Sign
            }),
            new InterpreterLanguageResponse({
                code: 'ils',
                description: 'International Sign (IS)',
                type: InterpreterType.Sign
            }),
            new InterpreterLanguageResponse({
                code: 'spa',
                description: 'Spanish',
                type: InterpreterType.Verbal
            }),
            new InterpreterLanguageResponse({
                code: 'jpn',
                description: 'Japanese',
                type: InterpreterType.Verbal
            }),
            new InterpreterLanguageResponse({
                code: 'zul',
                description: 'Zulu',
                type: InterpreterType.Verbal
            })
        ];
    }

    private initConferenceDetails(scheduledDateTime): ConferenceResponse {
        const participants = this.getListOfParticipantDetails();
        const endpoints = this.getListOfEndpoints();
        return new ConferenceResponse({
            id: '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
            case_name: 'WM V T',
            case_number: '0987UDIHH',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: scheduledDateTime,
            scheduled_duration: 45,
            status: ConferenceStatus.NotStarted,
            participants: participants,
            participant_uri: 'participant@supplier.com',
            pexip_node_uri: 'node@supplier.com',
            hearing_venue_name: 'venue name',
            endpoints: endpoints,
            ingest_url: 'rtmp://vh-wowza-node/hearing_id',
            supplier: Supplier.Vodafone,
            hearing_venue_is_scottish: false,
            hearing_ref_id: '12AB52C6-BDA5-4F4D-95B8-3F49065216A9'
        });
    }
}
