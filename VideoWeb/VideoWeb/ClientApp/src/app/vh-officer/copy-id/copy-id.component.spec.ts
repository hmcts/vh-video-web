import { ClipboardService } from 'ngx-clipboard';
import { ConferenceResponseVho } from 'src/app/services/clients/api-client';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VhoQueryService } from '../services/vho-query-service.service';
import { CopyIdComponent } from './copy-id.component';

describe('CopyIdComponent', () => {
    let component: CopyIdComponent;
    let mouseEvent: MouseEvent;
    let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;
    let vhoQueryServiceSpy: jasmine.SpyObj<VhoQueryService>;
    let copyID: HTMLDivElement;

    const conference = new ConferenceTestData().getConferenceFuture();
    const hearing = new HearingSummary(conference);

    beforeAll(() => {
        mouseEvent = document.createEvent('MouseEvent');
        mouseEvent.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
        clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
        clipboardServiceSpy.copyFromContent.and.returnValue(true);

        vhoQueryServiceSpy = jasmine.createSpyObj('VhoQueryService', ['getConferenceByIdVHO']);

        vhoQueryServiceSpy.getConferenceByIdVHO.and.returnValue(Promise.resolve(conference));
    });

    beforeEach(() => {
        component = new CopyIdComponent(clipboardServiceSpy, vhoQueryServiceSpy);
        component.hearingId = hearing.id;
        component.ngOnInit();
        copyID = document.createElement('div');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should copy the conference id to the clipboard', () => {
        component.copyToClipboard();
        expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(hearing.id);
        expect(component.tooltip).toBe('Conference ID copied to clipboard');
    });
});
