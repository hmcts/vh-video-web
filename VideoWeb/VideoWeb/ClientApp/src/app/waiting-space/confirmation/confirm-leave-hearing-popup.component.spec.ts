import { ConfirmLeaveHearingPopupComponent } from './confirm-leave-hearing-popup.component';
import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';

describe('ConfirmLeaveHearingPopupComponent', () => {
    let component: ConfirmLeaveHearingPopupComponent;

    beforeEach(() => {
        component = new ConfirmLeaveHearingPopupComponent();
    });

    describe('AfterViewInit', () => {
        let div;
        let divElm;
        beforeEach(fakeAsync(() => {
            flushMicrotasks();
            div =
                '<div id="confirm-leave-hearing-modal" class="vh-popup-overlay">' +
                '<button\n' +
                '      id="btnConfirmLeave"\n' +
                '      class="govuk-button govuk-!-margin-right-1"\n' +
                '      type="button"\n' +
                '      data-module="govuk-button"\n' +
                '      (click)="respondWithYes()"\n' +
                '    >\n' +
                '    Leave\n' +
                '    </button>\n' +
                '</div>';

            divElm = document.createElement('div');
            divElm.innerHTML = div;

            document.body.appendChild(divElm);
        }));
        afterEach(() => {
            divElm.remove();
        });
        it('should set focus on btnLeave', fakeAsync(() => {
            const activeElm = document.getElementById('btnConfirmLeave');

            activeElm.focus();
            document.getElementById = jasmine.createSpy('HTML Element').and.returnValue(divElm);
            divElm.querySelectorAll = jasmine.createSpy('Query Selector').and.returnValue(divElm.childNodes);

            component.btnLeave = jasmine.createSpyObj('btnLeave', ['nativeElement']);

            const elmSpy = component.btnLeave.nativeElement;
            elmSpy.focus = function () {};
            spyOn(elmSpy, 'focus').and.callFake(() => {});

            component.ngAfterViewInit();
            expect(component.btnLeave.nativeElement.focus).toHaveBeenCalled();
        }));

        it('should handle keydown Tab', fakeAsync(() => {
            const focusableEls: NodeListOf<HTMLElement> = divElm.querySelectorAll(
                'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])'
            );

            const firstFocusableEl = focusableEls[0];

            firstFocusableEl.focus();

            document.getElementById = jasmine.createSpy('HTML Element').and.returnValue(divElm);
            divElm.querySelectorAll = jasmine.createSpy('Query Selector').and.returnValue(focusableEls);

            component.btnLeave = jasmine.createSpyObj('btnLeave', ['nativeElement']);

            const elmSpy = component.btnLeave.nativeElement;
            elmSpy.focus = function () {};
            spyOn(elmSpy, 'focus').and.callFake(() => {});

            component.ngAfterViewInit();

            const event = new KeyboardEvent('keydown', { key: 'Tab' });
            event.preventDefault = function () {};
            spyOn(event, 'preventDefault');

            divElm.dispatchEvent(event);
            tick();

            expect(event.preventDefault).toHaveBeenCalled();
        }));

        it('should handle keydown Shift-Tab', fakeAsync(() => {
            const focusableEls: NodeListOf<HTMLElement> = divElm.querySelectorAll(
                'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])'
            );

            const firstFocusableEl = focusableEls[0];

            firstFocusableEl.focus();

            document.getElementById = jasmine.createSpy('HTML Element').and.returnValue(divElm);
            divElm.querySelectorAll = jasmine.createSpy('Query Selector').and.returnValue(focusableEls);

            component.btnLeave = jasmine.createSpyObj('btnLeave', ['nativeElement']);

            const elmSpy = component.btnLeave.nativeElement;
            elmSpy.focus = function () {};
            spyOn(elmSpy, 'focus').and.callFake(() => {});

            component.ngAfterViewInit();

            const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
            event.preventDefault = function () {};
            spyOn(event, 'preventDefault');

            divElm.dispatchEvent(event);
            tick();

            expect(event.preventDefault).toHaveBeenCalled();
        }));
    });
});
