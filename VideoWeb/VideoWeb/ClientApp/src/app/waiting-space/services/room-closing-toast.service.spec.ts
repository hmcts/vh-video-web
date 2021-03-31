import { TestBed } from '@angular/core/testing';
import * as moment from 'moment';
import { ToastrService, ActiveToast, Toast } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { RoomClosingToastComponent } from 'src/app/shared/toast/room-closing/room-closing-toast.component';
import { ToastrTestingModule } from 'src/app/shared/toast/toastr-testing.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { RoomClosingToastrService } from './room-closing-toast.service';

describe('RoomClosingToastrService', () => {
    const conferenceTestData = new ConferenceTestData();
    const logger: Logger = new MockLogger();
    let toastrService: jasmine.SpyObj<ToastrService>;
    let sut: RoomClosingToastrService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ToastrTestingModule],
            providers: [{ provider: ToastrService, useValue: toastrService }]
        });

        const mockToast = createMockToast();
        toastrService = jasmine.createSpyObj<ToastrService>('ToastrService', ['show', 'clear', 'remove']);
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

    function createMockToast() {
        const mockToast = {
            toastId: 123,
            toastRef: {
                componentInstance: {
                    dismiss: new Subject<any>()
                }
            }
        } as ActiveToast<RoomClosingToastComponent>;
        return mockToast;
    }

    // ---------------------
    // <-- private functions
    // ---------------------

    it('should create the sut', async () => {
        expect(sut).toBeTruthy();
    });

    describe('showRoomClosingAlert()', () => {
        it('should NOT show "room closing" toast when hearing is NOT closed', async () => {
            // arrange
            const hearing = getNotClosedHearing();

            // act
            const result = sut.showRoomClosingAlert(hearing, new Date());

            // assert
            expect(result).toBeFalsy();
        });

        it('should NOT show "room closing" toast when hearing is closed AND hearing is expired', async () => {
            // arrange
            const hearing = getExpiredHearing();

            // act
            const result = sut.showRoomClosingAlert(hearing, new Date());

            // assert
            expect(result).toBeFalsy();
        });

        it('should NOT show "room closing" toast when hearing is closed AND NOT expired, AND there is an active "room closing" toast', async () => {
            // arrange
            const hearing = getClosedButNotExpiredHearing();
            sut.currentToast = createMockToast();

            // act
            const result = sut.showRoomClosingAlert(hearing, new Date());

            // assert
            expect(result).toBeFalsy();
        });

        it('should show "room closing" toast when hearing is closed and NOT expired AND there is NO active "room closing" toast', async () => {
            // arrange
            const hearing = getClosedButNotExpiredHearing();

            const expiresAt = hearing.retrieveExpiryTime();
            const now = moment(expiresAt).subtract(4, 'minutes').subtract(59, 'seconds');

            // act
            sut.showRoomClosingAlert(hearing, now.toDate());

            // assert
            expect(toastrService.show).toHaveBeenCalledTimes(1);
            expect(sut.currentToast).toBeTruthy();
        });
    });

    describe('clearToasts()', () => {
        it('should close open toast', () => {
            // arrange
            sut.currentToast = createMockToast();

            // act
            sut.clearToasts();

            // assert
            expect(toastrService.remove).toHaveBeenCalledTimes(1);
            expect(sut.toastsDismissed).toEqual(1);
            expect(sut.currentToast).toBeFalsy();
        });
    });
});
