import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { Participant } from './participant';
import { ParticipantStatus } from 'src/app/services/clients/api-client';

describe('Participant', () => {
    it('should throw an error if passing an invlid type', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants[0];
        expect(() => new Participant(p)).toThrowError();
    });

    it('should return `not signed in` when with default status', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.None;
        const participant = new Participant(p);
        expect(participant.getStatusAsText()).toBe('Not Signed In');
    });

    it('should return `not signed in`', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.NotSignedIn;
        const participant = new Participant(p);
        expect(participant.getStatusAsText()).toBe('Not Signed In');
    });

    it('should return `In Consulation`', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.InConsultation;
        const participant = new Participant(p);
        expect(participant.getStatusAsText()).toBe('In Consultation');
    });

    it('should return `In Hearing`', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.InHearing;
        const participant = new Participant(p);
        expect(participant.getStatusAsText()).toBe('In Hearing');
    });

    it('should return `Unable to Join`', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.UnableToJoin;
        const participant = new Participant(p);
        expect(participant.getStatusAsText()).toBe('Unable to Join');
    });

    it('should return status', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.Available;
        const participant = new Participant(p);
        expect(participant.getStatusAsText()).toBe(ParticipantStatus.Available);
    });

    it('should return first character of first name and full last name', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants.find(x => x.name === 'Mr James Green');
        const participant = new Participant(p);
        expect(participant.initialedName).toBe('J Green');
    });

    it('should map participant info', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants.find(x => x.name === 'Mr James Green');
        const participant = new Participant(p);
        expect(participant.id).toBe(p.id);
        expect(participant.fullName).toBe(p.name);
        expect(participant.caseGroup).toBe(p.case_type_group);
        expect(participant.contactEmail).toBe(p.contact_email);
        expect(participant.contactTelephone).toBe(p.contact_telephone);
        expect(participant.status).toBe(p.status);
        expect(participant.role).toBe(p.role);
        expect(participant.representee).toBe(p.representee);
    });

    it('should return judge status Unavailable if judge disconnected in another hearing', () => {
        const judgeStatusInAnotherHearing = [ParticipantStatus.Disconnected];
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.NotSignedIn;
        const participant = new Participant(p);
        expect(participant.getStatusAsTextForJudge(judgeStatusInAnotherHearing)).toBe('Unavailable');
    });
    it('should return judge status Unavailable if judge not signed in in another hearing', () => {
        const judgeStatusInAnotherHearing = [ParticipantStatus.NotSignedIn];
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.None;
        const participant = new Participant(p);
        expect(participant.getStatusAsTextForJudge(judgeStatusInAnotherHearing)).toBe('Unavailable');
    });

    it('should return judge status Available if judge not signed in in another hearing', () => {
        const judgeStatusInAnotherHearing = [ParticipantStatus.NotSignedIn];
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.Available;
        const participant = new Participant(p);
        expect(participant.getStatusAsTextForJudge(judgeStatusInAnotherHearing)).toBe('Available');
    });

    it('should return judge status In another hearing if judge is in the another hearing', () => {
        const judgeStatusInAnotherHearing = [ParticipantStatus.InHearing];
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.NotSignedIn;
        const participant = new Participant(p);
        expect(participant.getStatusAsTextForJudge(judgeStatusInAnotherHearing)).toBe('In another hearing');
    });

    it('should return true if a judge', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[2];
        const participant = new Participant(p);
        expect(participant.isJudge).toBe(true);
    });
    it('should return empty initialed name if no first and last names set', () => {
      const p = new ConferenceTestData().getConferenceDetailFuture().participants[2];
      p.first_name = null;
      p.last_name = null;
      const participant = new Participant(p);
      expect(participant.initialedName).toBe(' ');
    });
    it('should return initialed name if last names set', () => {
      const p = new ConferenceTestData().getConferenceDetailFuture().participants[2];
      p.first_name = null;
      const participant = new Participant(p);
      expect(participant.initialedName.length > 0).toBe(true);
    });
    it('should return initialed name if first names set', () => {
      const p = new ConferenceTestData().getConferenceDetailFuture().participants[2];
      p.last_name = null;
      const participant = new Participant(p);
      expect(participant.initialedName.length > 0).toBe(true);
    });
    it('should return initialed name if first names set and last', () => {
      const p = new ConferenceTestData().getConferenceDetailFuture().participants[2];
      const participant = new Participant(p);
      expect(participant.initialedName.length > 0).toBe(true);
    });
});
