import { FocusService } from 'src/app/services/focus.service';
import { ConsultationLeaveComponent } from './consultation-leave.component';
import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';

describe('ConsultationLeaveComponent', () => {
    let component: ConsultationLeaveComponent;
    const focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus']);
    beforeEach(() => {
        component = new ConsultationLeaveComponent(focusServiceSpy);
    });

    it('should emit leave', () => {
        // Arrange
        spyOn(component.leave, 'emit');
        spyOn(component.closedModal, 'emit');

        // Act
        component.leaveConsultation();

        // Assert
        expect(component.leave.emit).toHaveBeenCalled();
        expect(component.closedModal.emit).toHaveBeenCalled();
    });

    it('should emit closed modal with modal name', () => {
        // Arrange
        spyOn(component.closedModal, 'emit');

        // ACT
        component.closeModal();

        // Assert
        expect(component.closedModal.emit).toHaveBeenCalled();
    });

    describe('ConsultationLeaveComponent.AfterViewInit', () => {
        let div;
        let divElm;
        const CSS_QUERY =
            'div.icon-button.dropdown.always-on, div.icon-button[tabindex], div.small-button[tabindex], ' +
            'div.icon-button:not(.dropdown) > fa-icon[tabindex], a[href]:not([disabled]), ' +
            'button:not([disabled]), div:not(.hide-panel) > * > * > * > * > textarea, input[type="text"]:not([disabled]), ' +
            'select:not([disabled])';
        beforeEach(fakeAsync(() => {
            flushMicrotasks();
            div =
                '<div class="consultation-modal" id="modal-window-confirmation">' +
                '<button\n' +
                '        id="consultation-leave-button"\n' +
                '        class="govuk-button govuk-!-margin-top-6 govuk-!-margin-bottom-0 govuk-!-margin-right-3"\n' +
                '        data-module="govuk-button"\n' +
                '        (click)="leaveConsultation()"\n' +
                '        [attr.alt]="\'consultation-leave.leave\' | translate"\n' +
                '        >\n' +
                '          Leave\n' +
                '        </button>\n' +
                '        <button\n' +
                '        id="consultation-stay-button"\n' +
                '        class="govuk-button govuk-!-margin-top-6 govuk-!-margin-bottom-0 govuk-button--secondary"\n' +
                '        data-module="govuk-button"\n' +
                '        (click)="closeModal()"\n' +
                '        [attr.alt]="\'consultation-leave.stay\' | translate"\n' +
                '        >\n' +
                '          Close\n' +
                '        </button>\n' +
                '</div>';

            divElm = document.createElement('div');
            divElm.innerHTML = div;

            document.body.appendChild(divElm);
        }));
        afterEach(() => {
            divElm.remove();
        });

        it('should handle keydown Tab', fakeAsync(() => {
            const focusableEls: NodeListOf<HTMLElement> = divElm.querySelectorAll(CSS_QUERY);
            const emptyList: NodeListOf<HTMLElement> = divElm.querySelectorAll('div.room-title-show-more[tabindex]');
            const lastFocusableEl = focusableEls[1];

            document.getElementById = jasmine.createSpy('HTML Element').and.returnValue(divElm);

            const documentSpy = jasmine.createSpyObj<Document>(['querySelectorAll']);
            documentSpy.querySelectorAll.withArgs(CSS_QUERY).and.returnValue(focusableEls);
            documentSpy.querySelectorAll.withArgs('div.room-title-show-more[tabindex]').and.returnValue(emptyList);

            component.ngAfterViewInit();

            lastFocusableEl.focus();
            const event = new KeyboardEvent('keydown', { key: 'Tab' });
            event.preventDefault = function () {};
            spyOn(event, 'preventDefault');

            divElm.dispatchEvent(event);
            tick();

            expect(event.preventDefault).toHaveBeenCalled();
        }));

        it('should handle keydown Shift-Tab', fakeAsync(() => {
            const focusableEls: NodeListOf<HTMLElement> = divElm.querySelectorAll(CSS_QUERY);
            const emptyList: NodeListOf<HTMLElement> = divElm.querySelectorAll('div.room-title-show-more[tabindex]');

            const firstFocusableEl = focusableEls[0];

            document.getElementById = jasmine.createSpy('HTML Element').and.returnValue(divElm);
            const documentSpy = jasmine.createSpyObj<Document>(['querySelectorAll']);
            documentSpy.querySelectorAll.withArgs(CSS_QUERY).and.returnValue(focusableEls);
            documentSpy.querySelectorAll.withArgs('div.room-title-show-more[tabindex]').and.returnValue(emptyList);

            component.ngAfterViewInit();

            firstFocusableEl.focus();

            const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
            event.preventDefault = function () {};
            spyOn(event, 'preventDefault');

            divElm.dispatchEvent(event);
            tick();

            expect(event.preventDefault).toHaveBeenCalled();
        }));
    });
});
