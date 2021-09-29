import { ClipboardService } from 'ngx-clipboard';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { CopyTelephoneIdComponent } from './copy-telephone-id.component';

describe('CopyIdComponent', () => {
    let component: CopyTelephoneIdComponent;
    let mouseEvent: MouseEvent;
    let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;
    const conference = new ConferenceTestData().getConferenceFuture();
    const hearing = new HearingSummary(conference);
    let translateServiceSpy: any;

    beforeAll(() => {
        mouseEvent = document.createEvent('MouseEvent');
        mouseEvent.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
        clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
        clipboardServiceSpy.copyFromContent.and.returnValue(true);
        translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    });

    beforeEach(() => {
        component = new CopyTelephoneIdComponent(clipboardServiceSpy, translateServiceSpy);
        component.telephoneId = hearing.telephoneConferenceId;
        component.telephoneNumber = hearing.telephoneConferenceNumber;
        component.ngOnInit();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should copy the telephone conference id to the clipboard', () => {
        component.copyToClipboard();
        const expectedContent = `${hearing.telephoneConferenceNumber} (ID: ${hearing.telephoneConferenceId})`;
        expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(expectedContent);
    });

    it('updates tooltip text when copyToClipboard is invoked', () => {
        component.tooltip = '';
        const expectedToolTipValue = 'expected value';
        translateServiceSpy.instant.and.returnValue(expectedToolTipValue);
        component.copyToClipboard();
        expect(component.tooltip).toBe(expectedToolTipValue);
        expect(translateServiceSpy.instant).toHaveBeenCalledWith('copy-telephone-id.tooltip-copied');
    });

    it('sets the tooltip text when component is initialized', () => {
        const expectedToolTipValue = 'expected value';
        translateServiceSpy.instant.and.returnValue(expectedToolTipValue);
        component.ngOnInit();
        expect(component.tooltip).toBe(expectedToolTipValue);
        expect(translateServiceSpy.instant).toHaveBeenCalledWith('copy-telephone-id.display-text');
    });

    it('resets text when resetText is invoked', () => {
        component.tooltip = 'some other text';
        const expectedToolTipValue = 'expected value';
        translateServiceSpy.instant.and.returnValue(expectedToolTipValue);
        component.resetText();
        expect(component.tooltip).toBe(expectedToolTipValue);
        expect(translateServiceSpy.instant).toHaveBeenCalledWith('copy-telephone-id.display-text');
    });
});
