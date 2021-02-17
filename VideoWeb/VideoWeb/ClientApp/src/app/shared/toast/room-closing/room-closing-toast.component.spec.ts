import * as moment from 'moment';
import { RoomClosingToastComponent } from './room-closing-toast.component';
import { Hearing } from '../../models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { Injectable, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { IndividualConfig, ToastPackage, ToastRef, ToastrModule, ToastrService } from 'ngx-toastr';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

// --> https://github.com/scttcper/ngx-toastr/issues/339
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
// <-- https://github.com/scttcper/ngx-toastr/issues/339

describe('RoomClosingToastComponent', () => {
    let fixture: ComponentFixture<RoomClosingToastComponent>;
    let toastPackageMock: {
        toastId: number;
        toastType: string;
        afterActivate: jasmine.Spy;
        config: { toastClass: string };
        message: string;
        title: string;
        toastRef: ToastRef<unknown>;
    };

    const conferenceTestData = new ConferenceTestData();
    let clockServiceMock: jasmine.SpyObj<ClockService>;
    let sut: RoomClosingToastComponent;
    const timeNow = new Date(2021, 1, 1, 10, 0, 0, 0);

    beforeEach(
        waitForAsync(() => {
            toastPackageMock = {
                toastId: 1,
                toastType: 'success',
                afterActivate: jasmine.createSpy('afterActivate'),
                config: { toastClass: 'custom-toast' },
                message: 'test message',
                title: 'test title',
                toastRef: new ToastRef(null)
            };

            clockServiceMock = jasmine.createSpyObj<ClockService>('ClockService', ['getClock']);
            clockServiceMock.getClock.and.returnValue(of(timeNow));

            TestBed.configureTestingModule({
                declarations: [RoomClosingToastComponent],
                imports: [BrowserAnimationsModule, ToastrModule.forRoot()],
                providers: [
                    { provide: ToastPackage, useValue: toastPackageMock },
                    { provide: ClockService, useValue: clockServiceMock }
                ],
                schemas: [NO_ERRORS_SCHEMA]
            });

            fixture = TestBed.createComponent(RoomClosingToastComponent);
            sut = fixture.componentInstance;
            sut.vhToastOptions = {
                color: 'white',
                onNoAction: async () => {
                    console.log('Toast Dismissed!');
                },
                buttons: []
            };
        })
    );

    afterEach(
        waitForAsync(() => {
            fixture.destroy();
        })
    );

    function getClosedButNotExpiredHearing(closedDateTime: Date): Hearing {
        const c = conferenceTestData.getConferenceDetailFuture();
        c.status = ConferenceStatus.Closed;
        c.closed_date_time = closedDateTime;

        const hearing = new Hearing(c);
        expect(hearing.isClosed()).toBeTruthy();
        expect(hearing.status).toEqual(ConferenceStatus.Closed);
        return hearing;
    }

    it(
        'should create the sut',
        waitForAsync(() => {
            fixture.detectChanges();

            expect(sut).toBeTruthy();
        })
    );

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

            // act
            sut.setHearing(hearing);
            sut.calcTimeLeft(timeNow);
            fixture.detectChanges();

            // assert
            expect(sut.durationStr).toEqual(timeLeftString);
        });
    });
});
