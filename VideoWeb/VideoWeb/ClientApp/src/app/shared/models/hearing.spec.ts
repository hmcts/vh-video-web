import { Hearing } from './hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ConferenceStatus } from 'src/app/services/clients/api-client';

describe('Hearing', () => {
    const testData = new ConferenceTestData();

    it('should throw an error if passing an invlid type', () => {
        const c = testData.getConferenceFuture();
        expect(() => new Hearing(c)).toThrowError();
    });

    it('should map hearing info', () => {
        const c = testData.getConferenceDetailFuture();
        const hearing = new Hearing(c);
        expect(hearing.id).toBe(c.id);
        expect(hearing.status).toBe(c.status);
        expect(hearing.caseName).toBe(c.case_name);
        expect(hearing.caseNumber).toBe(c.case_number);
        expect(hearing.scheduledStartTime).toEqual(c.scheduled_date_time);
        expect(hearing.scheduledEndTime).toBeDefined();
    });

    it('should return start time', () => {
        const conference = testData.getConferenceDetailNow();
        const hearing = new Hearing(conference);
        const endTime = hearing.scheduledStartTime;
        expect(endTime.getTime()).toBe(hearing.getConference().scheduled_date_time.getTime());
    });

    it('should return participants', () => {
        const conference = testData.getConferenceDetailNow();
        const hearing = new Hearing(conference);
        const participants = hearing.getParticipants();
        expect(participants).toBe(conference.participants);
    });

    it('should retrieve judge', () => {
        const conference = testData.getConferenceDetailNow();
        const hearing = new Hearing(conference);
        expect(hearing.judge).toBeDefined();
    });

    it('should return case type', () => {
        const conference = testData.getConferenceDetailNow();
        const hearing = new Hearing(conference);
        expect(hearing.caseType).toBe(conference.case_type);
    });

    it('should return status', () => {
        const conference = testData.getConferenceDetailNow();
        const hearing = new Hearing(conference);
        expect(hearing.status).toBe(conference.status);
    });

    it('should return end time', () => {
        const conference = testData.getConferenceDetailNow();
        const hearing = new Hearing(conference);
        const endTime = hearing.scheduledEndTime;
        expect(endTime.getTime()).toBeGreaterThan(hearing.getConference().scheduled_date_time.getTime());
    });

    it('should return true when conference is delayed by more than ten minutes', () => {
        const conference = testData.getConferenceDetailPast();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isDelayed()).toBeTruthy();
    });

    it('should return false when conference has started and passed scheduled start time', () => {
        const conference = testData.getConferenceDetailPast();
        conference.status = ConferenceStatus.InSession;
        const hearing = new Hearing(conference);
        expect(hearing.isDelayed()).toBeFalsy();
    });

    it('should return false when conference is not delayed by more than ten minutes', () => {
        const conference = testData.getConferenceDetailFuture();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isDelayed()).toBeFalsy();
    });

    it('should return true when conference has not started and more than five minutes before start time', () => {
        const conference = testData.getConferenceDetailFuture();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isOnTime()).toBeTruthy();
    });

    it('should return false when conference has not started and less than five minutes before start time', () => {
        const conference = testData.getConferenceDetailNow();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isOnTime()).toBeFalsy();
    });

    it('should return true when conference is due to start within five minutes', () => {
        const conference = testData.getConferenceDetailNow();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isStarting()).toBeTruthy();
    });

    it('should return false when conference is more than five minutes delayed', () => {
        const conference = testData.getConferenceDetailFuture();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isStarting()).toBeFalsy();
    });

    it('should return false when conference is more than two minutes to start time', () => {
        const conference = testData.getConferenceDetailFuture();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isStarting()).toBeFalsy();
    });

    it('should return false when conference is due to start within two minutes but has started', () => {
        const conference = testData.getConferenceDetailNow();
        conference.status = ConferenceStatus.InSession;
        const hearing = new Hearing(conference);
        expect(hearing.isStarting()).toBeFalsy();
    });

    it('should return true when conference has not started', () => {
        const conference = testData.getConferenceDetailNow();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new Hearing(conference);
        expect(hearing.isNotStarted()).toBeTruthy();
    });

    it('should return false when conference has started', () => {
        const conference = testData.getConferenceDetailNow();
        conference.status = ConferenceStatus.InSession;
        const hearing = new Hearing(conference);
        expect(hearing.isNotStarted()).toBeFalsy();
    });

    it('should return true when conference is closed', () => {
        const conference = testData.getConferenceDetailNow();
        conference.status = ConferenceStatus.Closed;
        const hearing = new Hearing(conference);
        expect(hearing.isClosed()).toBeTruthy();
    });

    it('should return false when conference is not closed', () => {
        const conference = testData.getConferenceDetailNow();
        conference.status = ConferenceStatus.InSession;
        const hearing = new Hearing(conference);
        expect(hearing.isClosed()).toBeFalsy();
    });

    it('should return true when conference is paused', () => {
        const conference = testData.getConferenceDetailNow();
        conference.status = ConferenceStatus.Paused;
        const hearing = new Hearing(conference);
        expect(hearing.isPaused()).toBeTruthy();
    });

    it('should return false when conference is not paused', () => {
        const conference = testData.getConferenceDetailNow();
        conference.status = ConferenceStatus.InSession;
        const hearing = new Hearing(conference);
        expect(hearing.isPaused()).toBeFalsy();
    });

    it('should return true when conference is suspended', () => {
        const conference = testData.getConferenceDetailNow();
        conference.status = ConferenceStatus.Suspended;
        const hearing = new Hearing(conference);
        expect(hearing.isSuspended()).toBeTruthy();
    });

    it('should return false when conference is not suspended', () => {
        const conference = testData.getConferenceDetailNow();
        conference.status = ConferenceStatus.Closed;
        const hearing = new Hearing(conference);
        expect(hearing.isSuspended()).toBeFalsy();
    });

    it('should return false when current is more 30 minutes from start time', () => {
        const conference = testData.getConferenceDetailFuture();
        const hearing = new Hearing(conference);
        expect(hearing.isReadyToStart()).toBeFalsy();
    });

    it('should return true when current is less than 30 minutes from start time', () => {
        const conference = testData.getConferenceDetailPast();
        const hearing = new Hearing(conference);
        expect(hearing.isReadyToStart()).toBeTruthy();
    });

    it('should return is past closed time', () => {
        const c = testData.getConferenceDetailFuture();
        c.status = ConferenceStatus.Closed;
        const closedDateTime = new Date(new Date().toUTCString());
        closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 120);
        c.closed_date_time = closedDateTime;
        const hearing = new Hearing(c);
        expect(hearing.isPastClosedTime()).toBeTruthy();
    });

    it('should get empty list of endpoints when not set', () => {
        const c = testData.getConferenceDetailFuture();
        c.endpoints = undefined;
        const hearing = new Hearing(c);
        expect(hearing.getEndpoints().length).toEqual(0);
    });

    it('should get list of endpoints', () => {
        const c = testData.getConferenceDetailFuture();

        const hearing = new Hearing(c);
        expect(hearing.getEndpoints().length).toBeGreaterThan(0);
        expect(hearing.getEndpoints()).toEqual(c.endpoints);
    });

    it('should get empty list when base class is vho conference', () => {
        const c = testData.asConferenceResponseVho(testData.getConferenceDetailFuture());
        const hearing = new Hearing(c);
        expect(hearing.getEndpoints().length).toEqual(0);
    });

    it('should return null for expiry time when hearing is not closed', () => {
        const c = testData.getConferenceDetailPast();
        const hearing = new Hearing(c);
        expect(hearing.retrieveExpiryTime()).toBeFalsy();
    });

    it('should retrieve expiry time which is later than the actual close time', () => {
        const c = testData.getConferenceDetailPast();
        c.status = ConferenceStatus.Closed;
        c.closed_date_time = new Date();
        const hearing = new Hearing(c);
        expect(hearing.retrieveExpiryTime().getTime()).toBeGreaterThan(hearing.actualCloseTime.getTime());
    });
});
