import { BasePortalHost, OverlayRef, ToastrService, ToastPackage, Toast, ToastRef } from 'ngx-toastr';
import { RoomClosingToastComponent } from './room-closing-toast.component';
import { ClockService } from 'src/app/services/clock.service';
import { of } from 'rxjs';
import { ToastrTestingModule } from '../toastr-testing.module';
import { TestBed } from '@angular/core/testing';

describe('RoomClosingToastComponent', () => {
    let toastrService: ToastrService;
    let toastPackage: ToastPackage;
    let clockServiceMock: jasmine.SpyObj<ClockService>;
    let sut: RoomClosingToastComponent;
    const timeNow = new Date(2021, 1, 1, 10, 0, 0, 0);

    beforeEach(() => {
        // create ToastrService
        toastrService = jasmine.createSpyObj<ToastrService>('ToastrService', ['show', 'clear', 'remove']);
        TestBed.configureTestingModule({
            imports: [ToastrTestingModule],
            providers: [{ provider: ToastrService, useValue: toastrService }]
        });

        // create ToastPackage
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

        // create ClockService
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

    it('should create the sut', () => {
        expect(sut).toBeTruthy();
    });

    [
        { nowMmSs: '00:01', timeLeftMmSs: '29:59' },
        { nowMmSs: '01:00', timeLeftMmSs: '29:00' },
        { nowMmSs: '29:00', timeLeftMmSs: '01:00' },
        { nowMmSs: '29:59', timeLeftMmSs: '00:01' }
    ].forEach(testCase => {
        it('should return duration left in conference if "now" is past the closing time but before the expiry time', () => {
            // arrange
            const timeNow = new Date(`2021-01-01T10:${testCase.nowMmSs}.000Z`);
            sut.expiryDate = new Date('2021-01-01T10:30:00.000Z');

            // act
            const duration = sut.calcTimeLeft(timeNow);

            // assert
            const alertMessage = `This room will close in ${testCase.timeLeftMmSs}`;
            expect(duration).toEqual(alertMessage);
        });
    });

    [{ nowMmSs: '30:00' }, { nowMmSs: '30:01' }].forEach(testCase => {
        it('should return "this room is closed" message if "now" is greater than or equal to the expiry time', () => {
            // arrange
            const timeNow = new Date(`2021-01-01T10:${testCase.nowMmSs}.000Z`);
            sut.expiryDate = new Date('2021-01-01T10:30:00.000Z');

            // act
            const duration = sut.calcTimeLeft(timeNow);

            // assert
            expect(duration).toEqual('This room is closed');
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
