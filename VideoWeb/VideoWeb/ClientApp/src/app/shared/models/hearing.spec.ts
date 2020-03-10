import { Hearing } from './hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ConferenceStatus } from 'src/app/services/clients/api-client';

describe('Hearing', () => {
    it('should throw an error if passing an invlid type', () => {
        const c = new ConferenceTestData().getConferenceFuture();
        expect(() => new Hearing(c)).toThrowError();
    });

    it('should return start time', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        const hearing = new Hearing(conference);
        const endTime = hearing.scheduledStartTime;
        expect(endTime.getTime()).toBe(hearing.getConference().scheduled_date_time.getTime());
    });

    it('should return participants', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        const hearing = new Hearing(conference);
        const participants = hearing.getParticipants();
        expect(participants).toBe(conference.participants);
    });

    it('should retrieve judge', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        const hearing = new Hearing(conference);
        expect(hearing.judge).toBeDefined();
    });

    it('should return case type', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        const hearing = new Hearing(conference);
        expect(hearing.caseType).toBe(conference.case_type);
    });

    it('should return status', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        const hearing = new Hearing(conference);
        expect(hearing.status).toBe(conference.status);
    });

    it('should return end time', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        const hearing = new Hearing(conference);
        const endTime = hearing.scheduledEndTime;
        expect(endTime.getTime()).toBeGreaterThan(hearing.getConference().scheduled_date_time.getTime());
    });

    it('should return true when conference is delayed by more than ten minutes', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isDelayed()).toBeTruthy();
    });

    it('should return false when conference has started and passed scheduled start time', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        conference.status = ConferenceStatus.InSession;
        const hearing = new Hearing(conference);
        expect(hearing.isDelayed()).toBeFalsy();
    });

    it('should return false when conference is not delayed by more than ten minutes', () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isDelayed()).toBeFalsy();
    });

    it('should return true when conference has not started and more than five minutes before start time', () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isOnTime()).toBeTruthy();
    });

    it('should return false when conference has not started and less than five minutes before start time', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isOnTime()).toBeFalsy();
    });

    it('should return true when conference is due to start within five minutes', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isStarting()).toBeTruthy();
    });

    it('should return false when conference is more than five minutes delayed', () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isStarting()).toBeFalsy();
    });

    it('should return false when conference is more than two minutes to start time', () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isStarting()).toBeFalsy();
    });

    it('should return false when conference is due to start within two minutes but has started', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.InSession;
        const hearing = new Hearing(conference);
        expect(hearing.isStarting()).toBeFalsy();
    });

    it('should return true when conference has not started', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isNotStarted()).toBeTruthy();
    });

    it('should return false when conference has started', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.InSession;
        const hearing = new Hearing(conference);
        expect(hearing.isNotStarted()).toBeFalsy();
    });

    it('should return true when conference is closed', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.Closed;
        const hearing = new Hearing(conference);
        expect(hearing.isClosed()).toBeTruthy();
    });

    it('should return false when conference is not closed', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.InSession;
        const hearing = new Hearing(conference);
        expect(hearing.isClosed()).toBeFalsy();
    });

    it('should return true when conference is paused', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.Paused;
        const hearing = new Hearing(conference);
        expect(hearing.isPaused()).toBeTruthy();
    });

    it('should return false when conference is not paused', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.InSession;
        const hearing = new Hearing(conference);
        expect(hearing.isPaused()).toBeFalsy();
    });

    it('should return true when conference is suspended', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.Suspended;
        const hearing = new Hearing(conference);
        expect(hearing.isSuspended()).toBeTruthy();
    });

    it('should return false when conference is not suspended', () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        conference.status = ConferenceStatus.Closed;
        const hearing = new Hearing(conference);
        expect(hearing.isSuspended()).toBeFalsy();
    });

    it('should return false when current is more 30 minutes from start time', () => {
        const conference = new ConferenceTestData().getConferenceDetailFuture();
        const hearing = new Hearing(conference);
        expect(hearing.isReadyToStart()).toBeFalsy();
    });

    it('should return true when current is less than 30 minutes from start time', () => {
        const conference = new ConferenceTestData().getConferenceDetailPast();
        const hearing = new Hearing(conference);
        expect(hearing.isReadyToStart()).toBeTruthy();
    });
});
