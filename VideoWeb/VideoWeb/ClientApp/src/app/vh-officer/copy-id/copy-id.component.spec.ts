import { ClipboardService } from 'ngx-clipboard';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { CopyIdComponent } from './copy-id.component';

describe('CopyIdComponent', () => {
    let component: CopyIdComponent;
    let mouseEvent: MouseEvent;
    let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;
    let copyID: HTMLDivElement;
    let conference: any;
    let hearing: any;

    beforeAll(() => {
        mouseEvent = document.createEvent('MouseEvent');
        mouseEvent.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
        clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
        clipboardServiceSpy.copyFromContent.and.returnValue(true);
    });

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceFuture();
        hearing = new HearingSummary(conference);
        component = new CopyIdComponent(clipboardServiceSpy);
        component.conference = hearing;
        component.ngOnInit();
        copyID = document.createElement('div');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should copy the conference id to the clipboard', () => {
        component.copyToClipboard(hearing);
        expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(hearing.id);
        expect(component.tooltip).toBe('Conference ID copied to clipboard');
    });
});
