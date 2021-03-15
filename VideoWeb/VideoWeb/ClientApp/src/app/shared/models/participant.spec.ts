import { LinkedParticipantResponse, LinkType } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { Participant } from './participant';

describe('Participant', () => {
    it('should throw an error if passing an invlid type', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants[0];
        expect(() => new Participant(p)).toThrowError();
    });

    it('should map participant info', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants.find(x => x.name === 'Mr James Green');
        const participant = new Participant(p);
        expect(participant.id).toBe(p.id);
        expect(participant.fullName).toBe(p.name);
        expect(participant.caseGroup).toBe(p.case_type_group);
        expect(participant.status).toBe(p.status);
        expect(participant.role).toBe(p.role);
        expect(participant.representee).toBe(p.representee);
    });

    it('should return true if a judge', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[2];
        const participant = new Participant(p);
        expect(participant.isJudge).toBe(true);
    });

    it('should return hearing role text', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[2];
        const participant = new Participant(p);
        expect(participant.hearingRoleText).toBe(HearingRole.JUDGE);
    });

    it('should return representee hearing role text', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[1];
        const participant = new Participant(p);
        expect(participant.hearingRoleText).toBe(`${HearingRole.REPRESENTATIVE} for ${p.representee}`);
    });

    it('should return true if an interpreter', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[2];
        p.hearing_role = HearingRole.INTERPRETER;
        const participant = new Participant(p);
        expect(participant.isInterpreterOrInterpretee).toBe(true);
    });

    it('should return true if an interpretee', () => {
        const linkedParticipants: LinkedParticipantResponse[] = [];
        const linkedParticipant = new LinkedParticipantResponse();
        linkedParticipant.link_type = LinkType.Interpreter;
        linkedParticipant.linked_id = '200';
        linkedParticipants.push(linkedParticipant);
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.hearing_role = HearingRole.LITIGANT_IN_PERSON;
        p.linked_participants = linkedParticipants;
        const participant = new Participant(p);
        expect(participant.isInterpreterOrInterpretee).toBe(true);
    });
});
