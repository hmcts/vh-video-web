import * as moment from 'moment';
import { BasePortalHost, OverlayRef, ToastrService, Toast } from 'ngx-toastr';
import { RoomClosingToastComponent } from './room-closing-toast.component';
import { Hearing } from '../../models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { of } from 'rxjs';

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
fdescribe('RoomClosingToastComponent', () => {
    const conferenceTestData = new ConferenceTestData();
    let toastrService: ToastrService;

    let toastPackage: ToastPackage;
    let clockServiceMock: jasmine.SpyObj<ClockService>;
    let sut: RoomClosingToastComponent;
    const timeNow = new Date(2021, 1, 1, 10, 0, 0, 0);

    beforeEach(() => {
        toastrService = jasmine.createSpyObj<ToastrService>('ToastrService', ['show', 'clear', 'remove']);

        TestBed.configureTestingModule({
            imports: [ToastrTestingModule],
            providers: [{ provider: ToastrService, useValue: toastrService }]
        });

        const config = {
            disableTimeOut: false,
            timeOut: 1,
            closeButton: true,
            extendedTimeOut: 1,
            progressBar: false,
            progressAnimation: null,
            enableHtml: false,
            toastClass: 'toast',
            positionClass: 'toast',
            titleClass: 'toast',
            messageClass: 'toast',
            easing: 'ease-in',
            easeTime: 300,
            tapToDismiss: false,
            toastComponent: Toast,
            onActivateTick: false,
            newestOnTop: false
        };
        const toastRef = new ToastRef(
            new OverlayRef(
                jasmine.createSpyObj<BasePortalHost>('BasePortalHost', ['detach'])
            )
        );
        toastPackage = new ToastPackage(1, config, 'tast toast', 'test', 'test', toastRef);

        clockServiceMock = jasmine.createSpyObj<ClockService>('ClockService', ['getClock']);
        clockServiceMock.getClock.and.returnValue(of(timeNow));

        sut = new RoomClosingToastComponent(toastrService, toastPackage, clockServiceMock);

        const onNoActionSpy = jasmine.createSpy().and.callFake(function () {
            return false;
        });
        sut.vhToastOptions = {
            color: 'white',
            onNoAction: onNoActionSpy,
            buttons: []
        };
        sut.ngOnInit();
    });

    afterEach(() => {
        sut.ngOnDestroy();
    });

    function getClosedButNotExpiredHearing(closedDateTime: Date): Hearing {
        const c = conferenceTestData.getConferenceDetailFuture();
        c.status = ConferenceStatus.Closed;
        c.closed_date_time = closedDateTime;

        const hearing = new Hearing(c);
        expect(hearing.isClosed()).toBeTruthy();
        expect(hearing.status).toEqual(ConferenceStatus.Closed);
        return hearing;
    }

    it('should create the sut', () => {
        expect(sut).toBeTruthy();
    });

    it('should unsubscribe all subcriptions on destroy component', () => {
        sut.ngOnDestroy();
        expect(sut.timeLeft$.closed).toBeTruthy();
    });

    [
        { minsLeft: 29, secondsLeft: 59 },
        { minsLeft: 29, secondsLeft: 0 },
        { minsLeft: 1, secondsLeft: 0 },
        { minsLeft: 0, secondsLeft: 1 }
    ].forEach(testCase => {
        it('should return duration left in conference if "now" is past closing time but before the expiry time', () => {
            // arrange
            const timeLeft = moment.duration(testCase.minsLeft, 'minutes').add(testCase.secondsLeft, 'seconds');
            const timeLeftString = moment.utc(timeLeft.asMilliseconds()).format('mm:ss');

            const timeSinceClosed = moment.duration(30, 'minutes').subtract(timeLeft);
            const closedDateTime = moment(timeNow).subtract(timeSinceClosed).toDate();

            const hearing = getClosedButNotExpiredHearing(closedDateTime);
            var expiryDate = hearing.retrieveExpiryTime();

            // act
            sut.setExpiryDate(expiryDate);
            sut.calcTimeLeft(timeNow);

            // assert
            expect(sut.durationStr).toEqual(timeLeftString);
        });
    });

    it('should call onNoAction if not actioned when removed', () => {
        sut.actioned = false;
        sut.remove();
        expect(sut.vhToastOptions.onNoAction).toHaveBeenCalledTimes(1);
    });

    it('should not call onNoAction if actioned when removed', () => {
        sut.actioned = true;
        sut.remove();
        expect(sut.vhToastOptions.onNoAction).toHaveBeenCalledTimes(0);
    });

    it('should call remove on base', () => {
        spyOn(RoomClosingToastComponent.prototype, 'remove');
        sut.remove();
        expect(RoomClosingToastComponent.prototype.remove).toHaveBeenCalledTimes(1);
    });

    it('should return true for get black', () => {
        sut.vhToastOptions.color = 'black';
        expect(sut.black).toBeTruthy();
    });

    it('should return false for get black', () => {
        sut.vhToastOptions.color = 'white';
        expect(sut.black).toBeFalsy();
    });

    it('should return true for get white', () => {
        sut.vhToastOptions.color = 'white';
        expect(sut.white).toBeTruthy();
    });

    it('should return false for get white', () => {
        sut.vhToastOptions.color = 'black';
        expect(sut.white).toBeFalsy();
    });

    it('should set actioned when handle action is called', () => {
        sut.actioned = false;
        sut.handleAction(function () {});
        expect(sut.actioned).toBeTruthy();
    });

    it('should execute passed function when action is called', () => {
        const functionSpy = jasmine.createSpy().and.callFake(function () {
            return false;
        });
        sut.handleAction(functionSpy);
        expect(functionSpy).toHaveBeenCalledTimes(1);
    });
});
