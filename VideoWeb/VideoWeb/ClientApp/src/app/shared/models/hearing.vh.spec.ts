import { VHHearing } from './hearing.vh';
import { VHParticipant, VHConference, VHEndpoint } from 'src/app/waiting-space/store/models/vh-conference';
import { ConferenceStatus, Role } from 'src/app/services/clients/api-client';

describe('VHHearing', () => {
    let conference: VHConference;
    let vhHearing: VHHearing;

    beforeEach(() => {
        conference = {
            id: '1',
            participants: [{ id: '1', role: Role.Judge } as VHParticipant, { id: '2', role: Role.Individual } as VHParticipant],
            caseType: 'CaseType',
            caseNumber: 'CaseNumber',
            caseName: 'CaseName',
            status: ConferenceStatus.NotStarted,
            scheduledDateTime: new Date(),
            duration: 30,
            endDateTime: new Date(),
            hearingVenueName: 'Venue',
            endpoints: [{ id: '1', displayName: 'Endpoint1' } as VHEndpoint]
        } as VHConference;

        vhHearing = new VHHearing(conference);
    });

    it('should return the correct id', () => {
        expect(vhHearing.id).toBe(conference.id);
    });

    it('should return the correct judge', () => {
        expect(vhHearing.judge).toBe(conference.participants[0]);
    });

    it('should return the correct case type', () => {
        expect(vhHearing.caseType).toBe(conference.caseType);
    });

    it('should return the correct case number', () => {
        expect(vhHearing.caseNumber).toBe(conference.caseNumber);
    });

    it('should return the correct case name', () => {
        expect(vhHearing.caseName).toBe(conference.caseName);
    });

    it('should return the correct status', () => {
        expect(vhHearing.status).toBe(conference.status);
    });

    it('should return the correct scheduled start time', () => {
        expect(vhHearing.scheduledStartTime).toEqual(conference.scheduledDateTime);
    });

    it('should return the correct scheduled end time', () => {
        const expectedEndTime = new Date(conference.scheduledDateTime.getTime());
        expectedEndTime.setUTCMinutes(expectedEndTime.getUTCMinutes() + conference.duration);
        expect(vhHearing.scheduledEndTime).toEqual(expectedEndTime);
    });

    it('should return the correct actual close time', () => {
        expect(vhHearing.actualCloseTime).toBe(conference.endDateTime);
    });

    it('should return the correct hearing venue name', () => {
        expect(vhHearing.hearingVenueName).toBe(conference.hearingVenueName);
    });

    it('should return the correct conference', () => {
        expect(vhHearing.getConference()).toBe(conference);
    });

    it('should return the correct participants', () => {
        expect(vhHearing.getParticipants()).toBe(conference.participants);
    });

    it('should return the correct endpoints', () => {
        expect(vhHearing.getEndpoints()).toBe(conference.endpoints);
    });

    it('should return the correct participant by id', () => {
        expect(vhHearing.getParticipantById('1')).toBe(conference.participants[0]);
    });

    describe('retrieveHearingExpiryTime', () => {
        it('should return the correct hearing expiry time', () => {
            const date = new Date(new Date().toUTCString());
            date.setUTCHours(date.getUTCHours() - 26);
            conference.scheduledDateTime = date;
            conference.status = ConferenceStatus.Closed;
            conference.endDateTime = new Date(new Date().toUTCString());

            vhHearing = new VHHearing(conference);

            expect(vhHearing.retrieveHearingExpiryTime().isAfter(vhHearing.actualCloseTime)).toBeTrue();
        });

        it('should return null if actual close time is null', () => {
            conference.endDateTime = null;
            vhHearing = new VHHearing(conference);

            const expiryTime = vhHearing.retrieveHearingExpiryTime();
            expect(expiryTime).toBeFalsy();
        });
    });

    describe('retrieveExpiryTime', () => {
        it('should return the correct hearing expiry time', () => {
            const date = new Date(new Date().toUTCString());
            date.setUTCHours(date.getUTCHours() - 26);
            conference.scheduledDateTime = date;
            conference.status = ConferenceStatus.Closed;
            conference.endDateTime = new Date(new Date().toUTCString());

            vhHearing = new VHHearing(conference);

            expect(vhHearing.retrieveExpiryTime().getTime()).toBeGreaterThan(vhHearing.actualCloseTime.getTime());
        });

        it('should return null if actual close time is null', () => {
            conference.endDateTime = null;
            vhHearing = new VHHearing(conference);

            const expiryTime = vhHearing.retrieveExpiryTime();
            expect(expiryTime).toBeFalsy();
        });
    });

    describe('isPastClosedTime', () => {
        it('should return whether the hearing is past closed time', () => {
            const date = new Date(new Date().toUTCString());
            date.setUTCHours(date.getUTCHours() - 26);
            conference.scheduledDateTime = date;
            conference.status = ConferenceStatus.Closed;

            const closedDateTime = new Date(new Date().toUTCString());
            closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 120);
            conference.endDateTime = closedDateTime;

            vhHearing = new VHHearing(conference);

            expect(vhHearing.isPastClosedTime()).toBeTrue();
        });
    });
});
