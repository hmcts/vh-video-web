import * as moment from 'moment';
import { ToastrService, ActiveToast, Toast } from 'ngx-toastr';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { RoomClosingToastComponent } from 'src/app/shared/toast/room-closing/room-closing-toast.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { RoomClosingToastrService } from './room-closing-toast.service';

// --> https://github.com/scttcper/ngx-toastr/issues/339#issuecomment-508750488
import { Injectable, NgModule } from '@angular/core';
import { IndividualConfig, ToastPackage, ToastRef, ToastrModule } from 'ngx-toastr';
import { TestBed } from '@angular/core/testing';

@Injectable()
class MockToastPackage extends ToastPackage {
    constructor() {
        const toastConfig = { toastClass: 'custom-toast' };
        super(1, <IndividualConfig>toastConfig, 'test message', 'test title', 'show', new ToastRef(null));
    }
}

@NgModule({
    providers: [{ provide: ToastPackage, useClass: MockToastPackage }],
    imports: [ToastrModule.forRoot()],
    exports: [ToastrModule]
})
export class ToastrTestingModule {}
// <-- https://github.com/scttcper/ngx-toastr/issues/339#issuecomment-508750488

fdescribe('RoomClosingToastrService', () => {
    const conferenceTestData = new ConferenceTestData();
    const logger: Logger = new MockLogger();
    const toastrService = jasmine.createSpyObj<ToastrService>('ToastrService', ['show', 'clear', 'remove']);
    let sut: RoomClosingToastrService;

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
        toastrService.show.and.returnValue(mockToast);
        toastrService.remove.and.returnValue(true);

        sut = new RoomClosingToastrService(logger, toastrService);
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

    //     it('should create the sut', async () => {
    //         expect(sut).toBeTruthy();
    //     });

    //     describe('shouldShowAlert()', () => {
    //         it('should return false when hearing is NOT closed', async () => {
    //             // arrange
    //             const hearing = getNotClosedHearing();

    //             // act
    //             const result = sut.shouldShowAlert(hearing);

    //             // assert
    //             expect(result).toBeFalsy();
    //         });

    //         it('should return false when hearing is closed AND hearing is expired', async () => {
    //             // arrange
    //             const hearing = getExpiredHearing();

    //             // act
    //             const result = sut.shouldShowAlert(hearing);

    //             // assert
    //             expect(result).toBeFalsy();
    //         });

    //         it('should return false when hearing is closed AND NOT expired, AND there is an active "room closing" toast', async () => {
    //             // arrange
    //             const hearing = getClosedButNotExpiredHearing();
    //             sut.isCurrentlyShowingToast = true;

    //             // act
    //             const result = sut.shouldShowAlert(hearing);

    //             // assert
    //             expect(result).toBeFalsy();
    //         });

    //         it('should return true when hearing is closed and NOT expired AND there is NO active "room closing" toast', async () => {
    //             // arrange
    //             const hearing = getClosedButNotExpiredHearing();

    //             // act
    //             const result = sut.shouldShowAlert(hearing);

    //             // assert
    //             expect(result).toBeTruthy();
    //         });
    //     });

    //     describe('getGates()', () => {
    //         it('should return correct times ("gates") to show notifications', async () => {
    //             // arrange
    //             const expiresAt = new Date(2021, 1, 1, 10, 0, 0, 0);

    //             // act
    //             const result = sut.getGates(expiresAt);

    //             // assert
    //             expect(result.length).toBe(2);
    //             expect(result[0]).toEqual(moment(expiresAt).subtract(5, 'minutes'));
    //             expect(result[1]).toEqual(moment(expiresAt).subtract(30, 'seconds'));
    //         });
    //     });

    //     describe('hasEarliestGateBeenPassed()', () => {
    //         it('should return false when earliest gate has NOT been passed', async () => {
    //             // arrange
    //             const momentNow = moment(new Date(2021, 1, 1, 10, 0, 0, 0));
    //             const afterNow = moment(new Date(2021, 1, 1, 10, 0, 1, 0));
    //             const gates = [afterNow];

    //             // act
    //             const result = sut.hasEarliestGateBeenPassed(gates, momentNow);

    //             // assert
    //             expect(result).toBeFalsy();
    //         });

    //         it('should return true when earliest gate has been passed', async () => {
    //             // arrange
    //             const momentNow = moment(new Date(2021, 1, 1, 10, 0, 0, 0));
    //             const beforeNow = moment(new Date(2021, 1, 1, 9, 59, 59, 0));
    //             const gates = [beforeNow];

    //             // act
    //             const result = sut.hasEarliestGateBeenPassed(gates, momentNow);

    //             // assert
    //             expect(result).toBeTruthy();
    //         });
    //     });

    //     describe('isGateBetweenLastShownTimeAndNowDate()', () => {
    //         it('should return true when "time now" is not between gate and expiry date', async () => {
    //             // arrange
    //             const momentNow = moment(new Date(2021, 1, 1, 10, 0, 0, 0));
    //             const expiryDate = new Date(2021, 1, 1, 10, 6, 0, 0);
    //             const gates = sut.getGates(expiryDate);

    //             // act
    //             const result = sut.isGateBetweenLastShownTimeAndNowDate(gates, momentNow);

    //             // assert
    //             expect(result).toBeFalsy();
    //         });

    //         it('should return true when "time now" is 5m between gate and expiry date', async () => {
    //             // arrange
    //             const timeNow = new Date(2021, 1, 1, 10, 0, 0, 0);
    //             const momentNow = moment(timeNow);
    //             const expiryDate = momentNow.add(5, 'minutes').toDate();
    //             const gates = sut.getGates(expiryDate);

    //             // act
    //             const result = sut.isGateBetweenLastShownTimeAndNowDate(gates, momentNow);

    //             // assert
    //             expect(result).toBeTruthy();
    //         });

    //         it('should return true when "time now" is 30s between gate and expiry date', async () => {
    //             // arrange
    //             const timeNow = new Date(2021, 1, 1, 10, 0, 0, 0);
    //             const momentNow = moment(timeNow);
    //             const expiryDate = momentNow.add(30, 'seconds').toDate();
    //             const gates = sut.getGates(expiryDate);

    //             // act
    //             const result = sut.isGateBetweenLastShownTimeAndNowDate(gates, momentNow);

    //             // assert
    //             expect(result).toBeTruthy();
    //         });
    //     });

    //     describe('showToast()', () => {
    //         it('should show toast and set all correct properties', () => {
    //             // arrange
    //             const hearing = getClosedButNotExpiredHearing();
    //             sut.setRoomClosingLastShown(moment(hearing.getConference().closed_date_time));

    //             const expiresAt = hearing.retrieveExpiryTime();
    //             const now = moment(expiresAt).subtract(4, 'minutes').subtract(59, 'seconds');

    //             // act
    //             sut.showToast(hearing, now);

    //             // assert
    //             expect(sut.isCurrentlyShowingToast).toBeTrue();
    //             expect(toastrService.show).toHaveBeenCalledTimes(1);
    //         });
    //     });

    // test for public method:
    xdescribe('showRoomClosingAlert()', () => {
        fit('should show toast when all conditions are met', () => {
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
