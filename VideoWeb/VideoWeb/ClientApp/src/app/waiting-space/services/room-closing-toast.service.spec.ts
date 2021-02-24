import { TestBed } from '@angular/core/testing';
import * as moment from 'moment';
import { ToastrService, ActiveToast, Toast } from 'ngx-toastr';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { RoomClosingToastComponent } from 'src/app/shared/toast/room-closing/room-closing-toast.component';
import { ToastrTestingModule } from 'src/app/shared/toast/toastr-testing.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { RoomClosingToastrService } from './room-closing-toast.service';

export class RoomClosingToastrServiceFacade extends RoomClosingToastrService {
    getDurations(): moment.Duration[] {
        return super.getDurations();
    }

    getGates(durations: moment.Duration[], expiresAt: Date): Date[] {
        return super.getGates(durations, expiresAt);
    }

    getPastGates(timeNow: Date): Date[] {
        return super.getPastGates(timeNow);
    }

    showToast(expiryDate: Date): void {
        super.showToast(expiryDate);
    }

    onToastClosed(timeNow: Date): void {
        super.onToastClosed(timeNow);
    }
}

describe('RoomClosingToastrService', () => {
    const conferenceTestData = new ConferenceTestData();
    const logger: Logger = new MockLogger();
    let toastrService: jasmine.SpyObj<ToastrService>;
    let sut: RoomClosingToastrServiceFacade;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ToastrTestingModule],
            providers: [{ provider: ToastrService, useValue: toastrService }]
        });

        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<RoomClosingToastComponent>;
        toastrService = jasmine.createSpyObj<ToastrService>('ToastrService', ['show', 'clear', 'remove']);
        toastrService.show.and.returnValue(mockToast);
        toastrService.remove.and.returnValue(true);

        sut = new RoomClosingToastrServiceFacade(logger, toastrService);
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

    describe('getGates()', () => {
        it('should return correct times ("gates") to show notifications', async () => {
            // arrange
            const expiresAt = new Date(2021, 1, 1, 10, 0, 0, 0);

            const durations: moment.Duration[] = [];
            const fiveMinsLeft = moment.duration(5, 'minutes');
            const thirtySecondsLeft = moment.duration(30, 'seconds');
            durations.push(fiveMinsLeft);
            durations.push(thirtySecondsLeft);

            // act
            const result = sut.getGates(durations, expiresAt);

            // assert
            expect(result.length).toBe(2);
            expect(result[0]).toEqual(new Date(2021, 1, 1, 9, 55, 0, 0)); // 5m left
            expect(result[1]).toEqual(new Date(2021, 1, 1, 9, 59, 30, 0)); // 30s left
        });
    });

    describe('getPastGates()', () => {
        it('should return the gates that are in the past', async () => {
            // arrange
            const dateInThePast = new Date(2021, 1, 1, 9, 59, 59, 0);
            const dateInTheFuture = new Date(2021, 1, 1, 10, 0, 1, 0);
            sut.gates = [dateInThePast, dateInTheFuture];
            const timeNow = new Date(2021, 1, 1, 10, 0, 0, 0);

            // act
            const result = sut.getPastGates(timeNow);

            // assert
            expect(result.length).toBe(1);
            expect(result[0]).toEqual(dateInThePast);
        });

        it('should NOT return any gates that are in the future', async () => {
            // arrange
            const dateInTheFuture1 = new Date(2021, 1, 1, 10, 0, 1, 0);
            const dateInTheFuture2 = new Date(2021, 1, 1, 10, 0, 2, 0);
            sut.gates = [dateInTheFuture1, dateInTheFuture2];
            const timeNow = new Date(2021, 1, 1, 10, 0, 0, 0);

            // act
            const result = sut.getPastGates(timeNow);

            // assert
            expect(result.length).toBe(0);
        });
    });

    describe('showToast()', () => {
        it('should show toast when there is ', () => {
            // arrange
            const hearing = getClosedButNotExpiredHearing();
            const expiresAt = hearing.retrieveExpiryTime();

            // act
            sut.showToast(expiresAt);

            // assert
            expect(sut.currentToast).toBeTruthy();
            expect(toastrService.show).toHaveBeenCalledTimes(1);
        });
    });

    describe('onToastClosed()', () => {
        it('should show toast and set all correct properties', () => {
            // arrange
            sut.shownGates = [
                new Date(2021, 1, 1, 10, 0, 0, 0),
                new Date(2021, 1, 1, 20, 0, 0, 0),
                new Date(2021, 1, 1, 30, 0, 0, 0),
                new Date(2021, 1, 1, 40, 0, 0, 0)
            ];

            const mockToast = {
                toastRef: {
                    componentInstance: {}
                }
            } as ActiveToast<RoomClosingToastComponent>;

            sut.currentToast = mockToast;

            // act
            sut.onToastClosed(new Date(2021, 1, 1, 15, 0, 0, 0));

            // assert
            expect(toastrService.remove).toHaveBeenCalledTimes(1);
            const expectedShownGates = sut.getPastGates(new Date());
            expect(sut.shownGates.length).toEqual(expectedShownGates.length);
            expect(sut.currentToast).toBeFalsy();
        });
    });

    // test for the big public method that ties it all together:
    describe('showRoomClosingAlert()', () => {
        it('should show toast when all conditions are met', () => {
            // arrange
            const hearing = getClosedButNotExpiredHearing();

            const expiresAt = hearing.retrieveExpiryTime();
            const now = moment(expiresAt).subtract(4, 'minutes').subtract(59, 'seconds');

            // act
            sut.showRoomClosingAlert(hearing, now.toDate());

            // assert
            expect(toastrService.show).toHaveBeenCalledTimes(1);
        });
    });
});
