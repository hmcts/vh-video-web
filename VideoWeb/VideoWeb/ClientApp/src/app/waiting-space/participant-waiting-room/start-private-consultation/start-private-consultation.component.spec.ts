import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, EndpointStatus, LinkType, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { StartPrivateConsultationComponent } from './start-private-consultation.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { HearingRole } from '../../models/hearing-role-model';
import { VHConference, VHEndpoint, VHParticipant } from '../../store/models/vh-conference';
import { mapConferenceToVHConference } from '../../store/models/api-contract-to-state-model-mappers';

describe('StartPrivateConsultationComponent', () => {
    let component: StartPrivateConsultationComponent;
    let conference: ConferenceResponse;
    let vhConference: VHConference;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let loggedInUser: VHParticipant;
    const translateService = translateServiceSpy;

    beforeAll(() => {
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');
    });

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        conference.participants.forEach(p => {
            p.status = ParticipantStatus.Available;
        });
        vhConference = mapConferenceToVHConference(conference);
        const judge = vhConference.participants.find(x => x.role === Role.Judge);

        loggedInUser = { ...judge };

        component = new StartPrivateConsultationComponent(translateService);
        component.loggedInUser = loggedInUser;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return participant selected', () => {
        component.selectedParticipants.push('guid');
        expect(component.participantSelected('guid')).toBeTruthy();
    });

    it('should return endpoint selected', () => {
        component.selectedEndpoints.push('guid');
        expect(component.endpointSelected('guid')).toBeTruthy();
    });

    it('should not return participant selected', () => {
        component.selectedParticipants.push('guid');
        component.toggleParticipant('guid');
        expect(component.selectedParticipants.indexOf('guid')).toEqual(-1);
    });

    it('should return participant selected', () => {
        component.selectedParticipants = new Array<string>();
        component.toggleParticipant('guid');
        expect(component.selectedParticipants.indexOf('guid')).toEqual(0);
    });

    it('should not return endpoint selected', () => {
        component.selectedEndpoints.push('guid');
        component.toggleEndpoint('guid');
        expect(component.selectedEndpoints.indexOf('guid')).toEqual(-1);
    });

    it('should return endpoint selected', () => {
        component.selectedEndpoints = new Array<string>();
        component.toggleEndpoint('guid');
        expect(component.selectedEndpoints.indexOf('guid')).toEqual(0);
    });

    it('should return endpoint selected but unselect others', () => {
        component.selectedEndpoints.push('guid2');
        component.toggleEndpoint('guid');
        expect(component.selectedEndpoints.indexOf('guid')).toEqual(0);
        expect(component.selectedEndpoints.indexOf('guid2')).toEqual(-1);
    });

    it('should return participant hearing role text', () => {
        expect(component.participantHearingRoleText(vhConference.participants[0])).toEqual('hearing-role.litigant-in-person');
    });

    it('should return participant representee hearing role text', () => {
        const representive = 'Representative';
        const representee = 'representee';
        const participant = vhConference.participants[0];
        participant.representee = representee;
        participant.hearingRole = representive;
        translateService.instant.calls.reset();
        expect(component.participantHearingRoleText(participant)).toEqual(
            `hearing-role.representative start-private-consultation.for ${representee}`
        );
    });

    it('should return unavailable status class for disconnected', () => {
        const participant = vhConference.participants[0];
        participant.status = ParticipantStatus.Disconnected;
        expect(component.getParticipantStatusCss(participant)).toEqual('unavailable');
    });

    it('should return unavailable status class for in hearing', () => {
        const participant = vhConference.participants[0];
        participant.status = ParticipantStatus.InHearing;
        expect(component.getParticipantStatusCss(participant)).toEqual('unavailable');
    });

    it('should return in-consultation status class', () => {
        const participant = vhConference.participants[0];
        participant.status = ParticipantStatus.InConsultation;
        expect(component.getParticipantStatusCss(participant)).toEqual('in-consultation');
    });

    it('should return unavailable status class for disconnected endpoint', () => {
        const endpoint = vhConference.endpoints[0];
        endpoint.status = EndpointStatus.Disconnected;
        expect(component.getEndpointStatusCss(endpoint)).toEqual('unavailable');
    });

    it('should return unavailable status class for in not yet joined endpoint', () => {
        const endpoint = vhConference.endpoints[0];
        endpoint.status = EndpointStatus.NotYetJoined;
        expect(component.getEndpointStatusCss(endpoint)).toEqual('unavailable');
    });

    it('should return in-consultation status class endpoint', () => {
        const endpoint = vhConference.endpoints[0];
        endpoint.status = EndpointStatus.InConsultation;
        expect(component.getEndpointStatusCss(endpoint)).toEqual('in-consultation');
    });

    it('should return enabled for participant with all linked participants available', () => {
        const participant = { status: ParticipantStatus.Available, linked_participants: [{ linked_id: '12345' }] };
        component.participants = [{ id: '12345', status: ParticipantStatus.Available }] as any[];
        expect(component.getParticipantDisabled(participant as any)).toBe(false);
    });

    it('should return enabled for participant with all linked participants available or in consultation', () => {
        const participant = { status: ParticipantStatus.InConsultation, linked_participants: [{ linked_id: '12345' }] };
        component.participants = [{ id: '12345', status: ParticipantStatus.InConsultation }] as any[];
        expect(component.getParticipantDisabled(participant as any)).toBe(false);
    });

    it('should return disabled for participant with some linked participants unavailable', () => {
        const participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', [], {
            id: '12345',
            status: ParticipantStatus.NotSignedIn,
            linkedParticipants: [{ linkedId: '12345' }]
        });
        component.participants = [{ id: '12345', status: ParticipantStatus.NotSignedIn }] as any[];
        expect(component.getParticipantDisabled(participant as any)).toBe(true);
    });

    it('should filter and sort participants', () => {
        const participantResponses: any[] = [
            {
                id: '1',
                hearing_role: HearingRole.INTERPRETER,
                linked_participants: []
            },
            {
                hearing_role: HearingRole.MACKENZIE_FRIEND,
                linked_participants: []
            },
            {
                id: '2',
                linked_participants: [{ linked_id: '1', link_type: LinkType.Interpreter }]
            },
            {
                id: '3',
                linked_participants: []
            },
            {
                id: '4',
                Role: Role.QuickLinkObserver,
                linked_participants: []
            },
            {
                id: '5',
                hearing_role: HearingRole.VICTIM,
                linked_participants: []
            },
            {
                id: '6',
                hearing_role: HearingRole.POLICE,
                linked_participants: []
            }
        ];

        const changes: any = { participants: { currentValue: participantResponses } };
        component.participants = participantResponses;
        component.ngOnChanges(changes);
        expect(component.filteredParticipants.length).toBe(3);
        expect(component.filteredParticipants[0].id).toBe('2');
        expect(component.filteredParticipants[0].interpreter.id).toBe('1');
        expect(component.filteredParticipants[1].id).toBe('3');
        expect(component.filteredParticipants[2].id).toBe('4');
    });

    describe('onContinue - logged in as solicitor', () => {
        beforeEach(() => {
            component.loggedInUser.role = Role.Representative;
        });

        it('should emit continue event with selected participants and no endpoints', () => {
            const emitSpy = spyOn(component.continue, 'emit');
            const participants = ['1', '2', '3'];
            component.selectedParticipants = participants;
            component.onContinue();
            expect(emitSpy).toHaveBeenCalledWith({ participants, endpoints: [] });
            expect(component.displayTermsOfService).toBeFalse();
        });

        it('should display terms of service when endpoints are selected', () => {
            const emitSpy = spyOn(component.continue, 'emit');
            component.selectedEndpoints = ['1', '2', '3'];
            component.onContinue();
            expect(emitSpy).not.toHaveBeenCalled();
            expect(component.displayTermsOfService).toBeTrue();
        });
    });

    describe('onContinue - logged in as non-solicitor', () => {
        beforeEach(() => {
            component.loggedInUser.role = Role.Judge;
        });

        it('should emit continue event with selected participants and endpoints', () => {
            const emitSpy = spyOn(component.continue, 'emit');
            component.selectedParticipants = ['1', '2', '3'];
            component.selectedEndpoints = ['4', '5', '6'];
            component.onContinue();
            expect(emitSpy).toHaveBeenCalledWith({ participants: ['1', '2', '3'], endpoints: ['4', '5', '6'] });
            expect(component.displayTermsOfService).toBeFalse();
        });
    });

    describe('onTermsOfServiceAccepted', () => {
        it('should emit continue event with selected participants and endpoints', () => {
            const emitSpy = spyOn(component.continue, 'emit');
            component.selectedParticipants = ['1', '2', '3'];
            component.selectedEndpoints = ['4', '5', '6'];
            component.onTermsOfServiceAccepted();
            expect(emitSpy).toHaveBeenCalledWith({ participants: ['1', '2', '3'], endpoints: ['4', '5', '6'] });
            expect(component.displayTermsOfService).toBeFalse();
        });
    });

    describe('participantIsInConsultationRoom', () => {
        let participant: VHParticipant;
        const allStatuses = Object.values(ParticipantStatus);
        const validStatuses = [ParticipantStatus.InConsultation];
        beforeEach(() => {
            participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['status', 'room']);
        });

        allStatuses.forEach(status => {
            it(`should return false when status is ${status} and room is null`, () => {
                participant.status = status;
                participant.room = null;
                expect(component.participantIsInConsultationRoom(participant)).toBeFalse();
            });

            const expectedValue = validStatuses.includes(status);
            it(`should return ${expectedValue} when status is ${status} and room is NOT null`, () => {
                participant.room = { label: 'Room1', locked: false };
                participant.status = status;
                expect(component.participantIsInConsultationRoom(participant)).toBe(expectedValue);
            });
        });
    });

    describe('endpointIsInConsultationRoom', () => {
        let endpoint: VHEndpoint;
        const allStatuses = Object.values(EndpointStatus);
        const validStatuses = [EndpointStatus.InConsultation];
        beforeEach(() => {
            endpoint = jasmine.createSpyObj<VHEndpoint>('VHEndpoint', ['status', 'room']);
        });

        allStatuses.forEach(status => {
            it(`should return false when status is ${status} and room is null`, () => {
                endpoint.status = status;
                endpoint.room = null;
                expect(component.endpointIsInConsultationRoom(endpoint)).toBeFalse();
            });

            const expectedValue = validStatuses.includes(status);
            it(`should return ${expectedValue} when status is ${status} and room is NOT null`, () => {
                endpoint.room = { label: 'Room1', locked: false };
                endpoint.status = status;
                expect(component.endpointIsInConsultationRoom(endpoint)).toBe(expectedValue);
            });
        });
    });
});
