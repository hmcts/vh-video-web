import { BasePortalHost, OverlayRef, Toast, ToastPackage, ToastRef } from 'ngx-toastr';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { toastrService } from 'src/app/waiting-space/waiting-room-shared/tests/waiting-room-base-setup';

describe('VhToastComponent', () => {
    let component: VhToastComponent;
    let toastPackage: ToastPackage;
    beforeEach(() => {
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
        component = new VhToastComponent(toastrService, toastPackage);
        const onNoActionSpy = jasmine.createSpy().and.callFake(function () {
            return false;
        });
        const cleanUpSpy = jasmine.createSpy();
        component.vhToastOptions = {
            color: 'white',
            body: '',
            htmlBody: 'string',
            buttons: [],
            onNoAction: onNoActionSpy,
            onRemove: cleanUpSpy
        };
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not try to call onNoAction if a method was not provided', () => {
        component.vhToastOptions.onNoAction = undefined;
        component.actioned = true;
        expect(() => component.remove()).not.toThrow();
        expect(component.vhToastOptions.onNoAction).toBeFalsy();
    });

    it('should not try to call onRemove if a method was not provided', () => {
        component.vhToastOptions.onRemove = undefined;
        component.actioned = true;
        expect(() => component.remove()).not.toThrow();
        expect(component.vhToastOptions.onRemove).toBeFalsy();
    });

    it('should call onNoAction if not actioned when removed', () => {
        component.actioned = false;
        component.remove();
        expect(component.vhToastOptions.onNoAction).toHaveBeenCalledTimes(1);
        expect(component.vhToastOptions.onRemove).toHaveBeenCalledTimes(1);
    });

    it('should not call onNoAction if actioned when removed', () => {
        component.actioned = true;
        component.remove();
        expect(component.vhToastOptions.onNoAction).toHaveBeenCalledTimes(0);
        expect(component.vhToastOptions.onRemove).toHaveBeenCalledTimes(1);
    });

    it('should call remove on base', () => {
        spyOn(VhToastComponent.prototype, 'remove');
        component.remove();
        expect(VhToastComponent.prototype.remove).toHaveBeenCalledTimes(1);
    });

    it('should return true for get black', () => {
        component.vhToastOptions.color = 'black';
        expect(component.black).toBeTruthy();
    });

    it('should return false for get black', () => {
        component.vhToastOptions.color = 'white';
        expect(component.black).toBeFalsy();
    });

    it('should return true for get white', () => {
        component.vhToastOptions.color = 'white';
        expect(component.white).toBeTruthy();
    });

    it('should return false for get white', () => {
        component.vhToastOptions.color = 'black';
        expect(component.white).toBeFalsy();
    });

    it('should set actioned when handle action is called', () => {
        component.actioned = false;
        component.handleAction(function () {});
        expect(component.actioned).toBeTruthy();
    });

    it('should execute passed function when action is called', () => {
        const functionSpy = jasmine.createSpy().and.callFake(function () {
            return false;
        });
        component.handleAction(functionSpy);
        expect(functionSpy).toHaveBeenCalledTimes(1);
    });
});
