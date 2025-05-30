import { VideoWebService } from 'src/app/services/api/video-web.service';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';

import { ConferenceResponse, ParticipantStatus, Role, RoomSummaryResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { globalConference, globalEndpoint, globalParticipant } from '../../waiting-room-shared/tests/waiting-room-base-setup';

import { JoinPrivateConsultationComponent } from './join-private-consultation.component';
import { mapEndpointToVHEndpoint, mapParticipantToVHParticipant } from '../../store/models/api-contract-to-state-model-mappers';

describe('JoinPrivateConsultationComponent', () => {
    let component: JoinPrivateConsultationComponent;
    let conference: ConferenceResponse;
    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;

    const translateService = translateServiceSpy;

    beforeAll(() => {
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');

        logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
    });

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        conference.participants.forEach(p => {
            p.status = ParticipantStatus.Available;
        });
        const judge = conference.participants.find(x => x.role === Role.Judge);

        component = new JoinPrivateConsultationComponent(logger, translateService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set selected room', () => {
        component.setSelectedRoom('room-label');
        expect(component.selectedRoomLabel).toEqual('room-label');
    });

    it('should return distinct rooms', () => {
        globalConference.participants[0].current_room = new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' });
        globalConference.participants[1].current_room = new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' });
        globalConference.participants[2].current_room = new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' });
        globalConference.participants[3].current_room = new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' });

        globalConference.endpoints[0].current_room = new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' });
        globalConference.endpoints[1].current_room = new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' });

        component.participants = globalConference.participants.map(mapParticipantToVHParticipant);
        component.endpoints = globalConference.endpoints.map(mapEndpointToVHEndpoint);
        expect(component.getRoomDetails()).toHaveSize(1);
    });

    it('should remove old rooms', () => {
        component.roomDetails = [
            {
                label: 'ConferenceRoom2',
                displayName: 'conference room 2',
                locked: false,
                participants: [globalParticipant],
                endpoints: [globalEndpoint]
            }
        ];
        globalConference.participants[0].current_room = new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' });
        globalConference.endpoints[0].current_room = new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' });

        component.participants = globalConference.participants.map(mapParticipantToVHParticipant);
        component.endpoints = globalConference.endpoints.map(mapEndpointToVHEndpoint);
        expect(component.getRoomDetails()).toHaveSize(1);
    });

    it('should return participant hearing role text', () => {
        const expectedText = 'hearing-role.litigant-in-person';
        translateService.instant.calls.reset();
        const vhParticipant = mapParticipantToVHParticipant(globalParticipant);
        expect(component.getParticipantHearingRoleText(vhParticipant)).toEqual(expectedText);
    });

    it('should return rooms available', () => {
        component.roomDetails = [new RoomSummaryResponse()];
        expect(component.roomsAvailable()).toBeTruthy();
    });

    it('should not return rooms available', () => {
        component.roomDetails = [];
        expect(component.roomsAvailable()).toBeFalsy();
    });

    it('should disable continue for no selected room', () => {
        component.selectedRoomLabel = null;
        expect(component.continueDisabled()).toBeTruthy();
    });

    it('should disable continue for locked selected room', () => {
        const label = 'ParticipantConsultationRoom1';
        component.selectedRoomLabel = label;
        const participant = mapParticipantToVHParticipant(globalParticipant);
        participant.room = { label: label, locked: true };
        component.participants = [participant];
        component.getRoomDetails();
        expect(component.continueDisabled()).toBeTruthy();
    });

    it('should enable continue for unlocked selected room', () => {
        const label = 'unlocked room';
        component.selectedRoomLabel = label;
        const participant = mapParticipantToVHParticipant(globalParticipant);
        participant.room = { label: label, locked: false };
        component.participants = [participant];
        component.getRoomDetails();
        expect(component.continueDisabled()).toBeFalsy();
    });

    it('should not display JOH rooms', () => {
        const label = 'JudgeJOH';
        const participant = mapParticipantToVHParticipant(globalParticipant);
        participant.room = { label: label, locked: false };
        component.participants = [participant];
        component.getRoomDetails();
        expect(component.roomDetails.length).toEqual(0);
    });
});
