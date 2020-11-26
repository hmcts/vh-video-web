import { ClipboardService } from 'ngx-clipboard';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { CopyTelephoneIdComponent } from './copy-telephone-id.component';

describe('CopyIdComponent', () => {
    let component: CopyTelephoneIdComponent;
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
        component = new CopyTelephoneIdComponent(clipboardServiceSpy);
        component.ngOnInit();
        copyID = document.createElement('div');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should copy the telephone conference id to the clipboard', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        const hearing = new HearingSummary(conference);
        component.copyToClipboard();
        expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(hearing.telephoneConferenceId);
        expect(component.tooltip).toBe('Details copied to clipboard');
    });
});
