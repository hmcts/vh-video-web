import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { HearingTimeReader } from './hearing-status-reader';

const timereader = new HearingTimeReader();

describe('HearingTimeReader', () => {
    it('should return true when conference is delayed by more than ten minutes', () => {
        const scheduledDateTime = new ConferenceTestData().getConferencePast().scheduled_date_time;
        const status = ConferenceStatus.NotStarted;
        expect(timereader.isDelayed(scheduledDateTime, status)).toBeTruthy();
    });

    it('should return false when conference has started and passed scheduled start time', () => {
        const scheduledDateTime = new ConferenceTestData().getConferencePast().scheduled_date_time;
        const status = ConferenceStatus.InSession;
        expect(timereader.isDelayed(scheduledDateTime, status)).toBeFalsy();
    });

    it('should return false when conference is not delayed by more than ten minutes', () => {
        const scheduledDateTime = new ConferenceTestData().getConferenceFuture().scheduled_date_time;
        const status = ConferenceStatus.NotStarted;
        expect(timereader.isDelayed(scheduledDateTime, status)).toBeFalsy();
    });

    it('should return true when conference has not started and more than five minutes before start time', () => {
        const scheduledDateTime = new ConferenceTestData().getConferenceFuture().scheduled_date_time;
        const status = ConferenceStatus.NotStarted;
        expect(timereader.isOnTime(scheduledDateTime, status)).toBeTruthy();
    });

    it('should return false when conference has not started and less than five minutes before start time', () => {
        const scheduledDateTime = new ConferenceTestData().getConferenceNow().scheduled_date_time;
        const status = ConferenceStatus.NotStarted;
        expect(timereader.isOnTime(scheduledDateTime, status)).toBeFalsy();
    });

    it('should return true when conference is due to start within five minutes', () => {
        const scheduledDateTime = new ConferenceTestData().getConferenceNow().scheduled_date_time;
        const status = ConferenceStatus.NotStarted;
        expect(timereader.isStarting(scheduledDateTime, status)).toBeTruthy();
    });

    it('should return false when conference is more than five minutes delayed', () => {
        const scheduledDateTime = new ConferenceTestData().getConferenceFuture().scheduled_date_time;
        const status = ConferenceStatus.NotStarted;
        expect(timereader.isStarting(scheduledDateTime, status)).toBeFalsy();
    });

    it('should return false when conference is more than two minutes to start time', () => {
        const scheduledDateTime = new ConferenceTestData().getConferencePast().scheduled_date_time;
        const status = ConferenceStatus.NotStarted;
        expect(timereader.isStarting(scheduledDateTime, status)).toBeFalsy();
    });

    it('should return false when conference is due to start within two minutes but has started', () => {
        const scheduledDateTime = new ConferenceTestData().getConferenceNow().scheduled_date_time;
        const status = ConferenceStatus.InSession;
        expect(timereader.isStarting(scheduledDateTime, status)).toBeFalsy();
    });

    it('should return 1 hour and 30 minutes when duration is 90 minutes', () => {
        const duration = 90;
        const result = timereader.getDurationAsText(duration);
        expect(result).toBe('1h 30m');
    });

    it('should return 2 hours and 30 minutes when duration is 150 minutes', () => {
        const duration = 150;
        const result = timereader.getDurationAsText(duration);
        expect(result).toBe('2h 30m');
    });

    it('should return 1 hour when duration is 60 minutes', () => {
        const duration = 60;
        const result = timereader.getDurationAsText(duration);
        expect(result).toBe('1h');
    });

    it('should return 25 minutes when duration is 25 minutes', () => {
        const duration = 25;
        const result = timereader.getDurationAsText(duration);
        expect(result).toBe('25m');
    });

    it('should return 1 minute when duration is 1 minute', () => {
        const duration = 1;
        const result = timereader.getDurationAsText(duration);
        expect(result).toBe('1m');
    });

    it('should return false when current is more 30 minutes from start time', () => {
        const scheduledDateTime = new ConferenceTestData().getConferenceFuture().scheduled_date_time;
        expect(timereader.isReadyToStart(scheduledDateTime)).toBeFalsy();
    });

    it('should return true when current is less than 30 minutes from start time', () => {
        const scheduledDateTime = new ConferenceTestData().getConferencePast().scheduled_date_time;
        expect(timereader.isReadyToStart(scheduledDateTime)).toBeTruthy();
    });

    it('should return false given conference is not closed when checking if past closed time', () => {
        const status = ConferenceStatus.InSession;
        const closedDateTime = undefined;
        expect(timereader.isPastClosedTime(closedDateTime, status)).toBeFalsy();
    });

    it('should return false given conference is closed for less than 30 minutes when checking if past closed time', () => {
        const status = ConferenceStatus.Closed;
        const closedDateTime = new Date();
        expect(timereader.isPastClosedTime(closedDateTime, status)).toBeFalsy();
    });

    it('should return true given conference is closed for more than 30 minutes when checking if past closed time', () => {
        const status = ConferenceStatus.Closed;
        const closedDateTime = new Date(new Date().toUTCString());
        closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 30);
        expect(timereader.isPastClosedTime(closedDateTime, status)).toBeTruthy();
    });

    it('should return true when conference has not started', () => {
        const status = ConferenceStatus.NotStarted;
        expect(timereader.isNotStarted(status)).toBeTruthy();
    });

    it('should return false when conference has started', () => {
        const status = ConferenceStatus.InSession;
        expect(timereader.isNotStarted(status)).toBeFalsy();
    });

    it('should return true when conference is closed', () => {
        const status = ConferenceStatus.Closed;
        expect(timereader.isClosed(status)).toBeTruthy();
    });

    it('should return false when conference is not closed', () => {
        const status = ConferenceStatus.InSession;
        expect(timereader.isClosed(status)).toBeFalsy();
    });

    it('should return true when conference is paused', () => {
        const status = ConferenceStatus.Paused;
        expect(timereader.isPaused(status)).toBeTruthy();
    });

    it('should return false when conference is not paused', () => {
        const status = ConferenceStatus.InSession;
        expect(timereader.isPaused(status)).toBeFalsy();
    });

    it('should return true when conference is suspended', () => {
        const status = ConferenceStatus.Suspended;
        expect(timereader.isSuspended(status)).toBeTruthy();
    });

    it('should return false when conference is not suspended', () => {
        const status = ConferenceStatus.Closed;
        expect(timereader.isSuspended(status)).toBeFalsy();
    });
});
