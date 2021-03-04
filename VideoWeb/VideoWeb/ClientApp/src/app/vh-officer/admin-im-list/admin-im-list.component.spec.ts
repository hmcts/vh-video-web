import { ConferenceResponseVho, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { AdminImListComponent } from './admin-im-list.component';

describe('AdminImListComponent', () => {
    let component: AdminImListComponent;
    let conference: ConferenceResponseVho;
    let hearing: Hearing;

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailNow();
        component = new AdminImListComponent();
        hearing = new Hearing(conference);
        component.hearing = hearing;
    });

    it('should populate list of participants to IM on init', () => {
        component.ngOnInit();
        expect(component.imParticipants.length).toBe(hearing.participants.length);
    });

    it('should populate only judge to IM on init', () => {
        component.initImParticipants(true);
        expect(component.imParticipants.length).toBe(1);
    });

    it('should populate list of participants to IM on init', () => {
        component.initImParticipants(false);
        expect(component.imParticipants.length).toBe(hearing.participants.length);
    });

    it('should update and emit selected participant on select', () => {
        component.currentParticipant = null;
        spyOn(component.selectedParticipant, 'emit');
        const participant = hearing.participants[0];

        component.selectParticipant(participant);

        expect(component.currentParticipant).toBe(participant);
        expect(component.selectedParticipant.emit).toHaveBeenCalledWith(participant);
    });

    const isParticipantAvailableTestCases = [
        { role: Role.Judge, status: ParticipantStatus.Available, expected: true },
        { role: Role.Judge, status: ParticipantStatus.InHearing, expected: true },
        { role: Role.Judge, status: ParticipantStatus.InConsultation, expected: false },
        { role: Role.Judge, status: ParticipantStatus.Disconnected, expected: false },
        { role: Role.Individual, status: ParticipantStatus.Available, expected: true },
        { role: Role.Individual, status: ParticipantStatus.InHearing, expected: false },
        { role: Role.Individual, status: ParticipantStatus.InConsultation, expected: false },
        { role: Role.Individual, status: ParticipantStatus.Disconnected, expected: false }
    ];

    isParticipantAvailableTestCases.forEach(test => {
        it(`should return availability as ${test.expected} when participant is ${test.role} and is ${test.status}`, () => {
            const participant = hearing.participants[0];
            participant.base.role = test.role;
            participant.base.status = test.status;
            expect(component.isParticipantAvailable(participant)).toBe(test.expected);
        });
    });
});
