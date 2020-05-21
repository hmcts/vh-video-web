import { ElementRef } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { CopyIdComponent } from './copy-id.component';

describe('CopyIdComponent', () => {
    let component: CopyIdComponent;
    let mouseEvent: MouseEvent;
    let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;
    let copyID: HTMLDivElement;

    beforeAll(() => {
        mouseEvent = document.createEvent('MouseEvent');
        mouseEvent.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
        clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
        clipboardServiceSpy.copyFromContent.and.returnValue(true);
    });

    beforeEach(() => {
        component = new CopyIdComponent(clipboardServiceSpy);
        component.ngOnInit();
        copyID = document.createElement('div');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should hide the tooltip on mouse out event', () => {
        component.onMouseOut();
        expect(component.displayTooltip).toBe(false);
    });

    it('should show the tooltip on mouse over event', () => {
        component.copyID = new ElementRef(copyID);
        component.onMouseOver(mouseEvent);

        const expectedTop = mouseEvent.clientY - 15 + 'px';
        const expectedLeft = mouseEvent.clientX + 20 + 'px';
        expect(copyID.style.top).toBe(expectedTop);
        expect(copyID.style.left).toBe(expectedLeft);

        expect(component.displayTooltip).toBe(true);
        expect(component.tooltip).toBe('Copy hearing ID to clipboard');
    });

    it('should not show tooltip if element if not ready', () => {
        component.copyID = null;
        component.displayTooltip = true;
        component.onMouseOver(mouseEvent);

        expect(component.displayTooltip).toBeTruthy();
    });

    it('should copy the conference id to the clipboard', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        const hearing = new HearingSummary(conference);
        component.copyToClipboard(hearing);
        expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(hearing.id);
        expect(component.displayTooltip).toBe(true);
        expect(component.tooltip).toBe('Hearing ID copied to clipboard');
    });
});
