import { Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingRoleHelper } from '../helpers/hearing-role-helper';
import { ParticipantSummary } from './participant-summary';

describe('ParticipantSummary', () => {
    it('should get base participant', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants[0];
        const participant = new ParticipantSummary(p);
        expect(participant.base).toBe(p);
    });

    it('should map participant info', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants[0];
        const participant = new ParticipantSummary(p);
        expect(participant.id).toBe(p.id);
        expect(participant.status).toBe(p.status);
        expect(participant.role).toBe(p.role);
        expect(participant.displayName).toBe(p.display_name);
        expect(participant.representee).toBe(p.representee);
        expect(participant.firstName).toBe(p.first_name);
        expect(participant.lastName).toBe(p.last_name);
    });

    it('should return true if a judge', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants.find(x => x.role === Role.Judge);
        const participant = new ParticipantSummary(p);
        expect(participant.isJudge).toBeTruthy();
    });

    it('should return false if not a judge', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants.find(x => x.role !== Role.Judge);
        const participant = new ParticipantSummary(p);
        expect(participant.isJudge).toBeFalsy();
    });

    describe('isParticipantPanelMember', () => {
        let isPanelMemberSpy: jasmine.Spy;
        let participantSummary: ParticipantSummary;
        beforeEach(() => {
            isPanelMemberSpy = spyOn(HearingRoleHelper, 'isPanelMember');
            const p = new ConferenceTestData().getConferenceFuture().participants[0];
            participantSummary = new ParticipantSummary(p);
        });

        const cases = [true, false];
        cases.forEach(value => {
            it(`should return ${value}`, () => {
                isPanelMemberSpy.and.returnValue(value);
                expect(participantSummary.isParticipantPanelMember).toBe(value);
                expect(isPanelMemberSpy).toHaveBeenCalledTimes(1);
                expect(isPanelMemberSpy).toHaveBeenCalledWith(participantSummary.hearingRole);
            });
        });
    });
});
