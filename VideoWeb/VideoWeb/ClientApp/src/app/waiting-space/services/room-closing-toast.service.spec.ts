import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { RoomClosingToastrService } from './room-closing-toast.service';

export class RoomClosingToastrServiceFacade extends RoomClosingToastrService {
    setRoomClosingLastShown(value: moment.Moment) {
        super.roomClosingLastShown = value;
    }

    shouldShowAlert(hearing: Hearing): boolean {
        return super.shouldShowAlert(hearing);
    }

    getGates(expiresAt: Date): moment.Moment[] {
        return super.getGates(expiresAt);
    }

    isGateBetweenLastShownTimeAndNowDate(gates: moment.Moment[], now: moment.Moment): boolean {
        return super.isGateBetweenLastShownTimeAndNowDate(gates, now);
    }
}

describe('RoomClosingToastrService', () => {
    const conferenceTestData = new ConferenceTestData();
    let sut: RoomClosingToastrServiceFacade;
    const logger: Logger = new MockLogger();
    let toastrService: jasmine.SpyObj<ToastrService>;

    beforeEach(() => {
        toastrService = jasmine.createSpyObj<ToastrService>('ToastrService', ['show', 'clear']);

        sut = new RoomClosingToastrServiceFacade(logger, toastrService);
        sut.setRoomClosingLastShown(moment(new Date(2021, 1, 1, 0, 0, 0, 0)));
    });

    // ---------------------
    // --> private functions
    // ---------------------

    function getNotClosedHearing(): Hearing {
        const c = conferenceTestData.getConferenceDetailNow();
        c.status = ConferenceStatus.InSession;

        const hearing = new Hearing(c);
        expect(hearing.isClosed()).toBeFalsy();
        return hearing;
    }

    function getExpiredHearing(): Hearing {
        const c = conferenceTestData.getConferenceDetailFuture();
        c.status = ConferenceStatus.Closed;
        c.closed_date_time = new Date(2000, 1, 1, 10, 0, 0, 0);

        const hearing = new Hearing(c);
        expect(hearing.isClosed()).toBeTruthy();
        expect(hearing.isExpired(c.closed_date_time)).toBeTruthy();
        expect(hearing.status).toEqual(ConferenceStatus.Closed);
        return hearing;
    }

    function getClosedButNotExpiredHearing(): Hearing {
        const closedDateTime = moment.utc().subtract(20, 'minutes').toDate();

        const c = conferenceTestData.getConferenceDetailFuture();
        c.status = ConferenceStatus.Closed;
        c.closed_date_time = closedDateTime;

        const hearing = new Hearing(c);
        expect(hearing.isClosed()).toBeTruthy();
        expect(hearing.status).toEqual(ConferenceStatus.Closed);
        return hearing;
    }

    // ---------------------
    // <-- private functions
    // ---------------------

    it('should create the sut', async () => {
        expect(sut).toBeTruthy();
    });

    describe('shouldShowAlert()', () => {
        it('should create the sut', async () => {
            expect(sut).toBeTruthy();
        });

        it('should return false when hearing is NOT closed', async () => {
            // arrange
            const hearing = getNotClosedHearing();

            // act
            const result = sut.shouldShowAlert(hearing);

            // assert
            expect(result).toBeFalsy();
        });

        it('should return false when hearing is closed AND hearing is expired', async () => {
            // arrange
            const hearing = getExpiredHearing();

            // act
            const result = sut.shouldShowAlert(hearing);

            // assert
            expect(result).toBeFalsy();
        });

        it('should return false when hearing is closed AND NOT expired, AND there is an active "room closing" toast', async () => {
            // arrange
            const hearing = getClosedButNotExpiredHearing();
            sut.isCurrentlyShowingToast = true;

            // act
            const result = sut.shouldShowAlert(hearing);

            // assert
            expect(result).toBeFalsy();
        });

        it('should return true when hearing is closed and NOT expired AND there is NO active "room closing" toast', async () => {
            // arrange
            const hearing = getClosedButNotExpiredHearing();

            // act
            const result = sut.shouldShowAlert(hearing);

            // assert
            expect(result).toBeTruthy();
        });
    });

    describe('getGates()', () => {
        it('should return correct times ("gates") to show notifications', async () => {
            // arrange
            const expiresAt = new Date(2021, 1, 1, 10, 0, 0, 0);

            // act
            const result = sut.getGates(expiresAt);

            // assert
            expect(result.length).toBe(2);
            expect(result[0]).toEqual(moment(expiresAt).subtract(5, 'minutes'));
            expect(result[1]).toEqual(moment(expiresAt).subtract(30, 'seconds'));
        });
    });

    describe('isGateBetweenLastShownTimeAndNowDate()', () => {
        it('should return true when "time now" is not between gate and expiry date', async () => {
            // arrange
            const momentNow = moment(new Date(2021, 1, 1, 10, 0, 0, 0));
            const expiryDate = new Date(2021, 1, 1, 10, 6, 0, 0);
            const gates = sut.getGates(expiryDate);

            // act
            const result = sut.isGateBetweenLastShownTimeAndNowDate(gates, momentNow);

            // assert
            expect(result).toBeFalsy();
        });

        it('should return true when "time now" is 5m between gate and expiry date', async () => {
            // arrange
            const timeNow = new Date(2021, 1, 1, 10, 0, 0, 0);
            const momentNow = moment(timeNow);
            const expiryDate = momentNow.add(5, 'minutes').toDate();
            const gates = sut.getGates(expiryDate);

            // act
            const result = sut.isGateBetweenLastShownTimeAndNowDate(gates, momentNow);

            // assert
            expect(result).toBeTruthy();
        });

        it('should return true when "time now" is 30s between gate and expiry date', async () => {
            // arrange
            const timeNow = new Date(2021, 1, 1, 10, 0, 0, 0);
            const momentNow = moment(timeNow);
            const expiryDate = momentNow.add(30, 'seconds').toDate();
            const gates = sut.getGates(expiryDate);

            // act
            const result = sut.isGateBetweenLastShownTimeAndNowDate(gates, momentNow);

            // assert
            expect(result).toBeTruthy();
        });
    });
});
