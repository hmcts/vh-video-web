import { ClipboardService } from 'ngx-clipboard';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { CopyIdComponent } from './copy-id.component';

describe('CopyIdComponent', () => {
    let component: CopyIdComponent;
    let mouseEvent: MouseEvent;
    let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;
    let conference: any;
    let hearing: any;
    let translateServiceSpy: any;

    beforeAll(() => {
        mouseEvent = document.createEvent('MouseEvent');
        mouseEvent.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
        clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
        clipboardServiceSpy.copyFromContent.and.returnValue(true);
        translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    });

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceFuture();
        hearing = new HearingSummary(conference);
        component = new CopyIdComponent(clipboardServiceSpy, translateServiceSpy);
        component.conference = hearing;
        component.ngOnInit();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should copy the conference id to the clipboard', () => {
        component.copyToClipboard(hearing);
        expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(hearing.id);
    });

    it('updates tooltip text when copyToClipboard is invoked', () => {
        component.tooltip = '';
        const expectedToolTipValue = 'expected value';
        translateServiceSpy.instant.and.returnValue(expectedToolTipValue);
        component.copyToClipboard(hearing);
        expect(component.tooltip).toBe(expectedToolTipValue);
        expect(translateServiceSpy.instant).toHaveBeenCalledWith('copy-id.tooltip-copied');
    });

    it('sets the tooltip text when component is initialized', () => {
        const expectedToolTipValue = 'expected value';
        translateServiceSpy.instant.and.returnValue(expectedToolTipValue);
        component.ngOnInit();
        expect(component.tooltip).toBe(expectedToolTipValue);
        expect(translateServiceSpy.instant).toHaveBeenCalledWith('copy-id.display-text');
    });

    it('resets text when resetText is invoked', () => {
        component.tooltip = 'some other text';
        const expectedToolTipValue = 'expected value';
        translateServiceSpy.instant.and.returnValue(expectedToolTipValue);
        component.resetText();
        expect(component.tooltip).toBe(expectedToolTipValue);
        expect(translateServiceSpy.instant).toHaveBeenCalledWith('copy-id.display-text');
    });
});
