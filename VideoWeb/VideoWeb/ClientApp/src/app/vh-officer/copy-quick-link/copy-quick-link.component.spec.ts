import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClipboardService } from 'ngx-clipboard';
import { ConferenceResponseVho } from 'src/app/services/clients/api-client';
import { VhoQueryService } from '../services/vho-query-service.service';
import { CopyQuickLinkComponent } from './copy-quick-link.component';

describe('CopyQuickLinkComponent', () => {
    let component: CopyQuickLinkComponent;
    let fixture: ComponentFixture<CopyQuickLinkComponent>;
    let clipboardService: any;
    let vhoQueryService: any;

    beforeEach(async () => {
        const coursesServiceSpy = jasmine.createSpyObj('ClipboardService', ['copyFromContent']);
        const vhoQueryServiceSpy = jasmine.createSpyObj('VhoQueryService', ['getConferenceByIdVHO']);

        await TestBed.configureTestingModule({
            declarations: [CopyQuickLinkComponent],
            providers: [
                { provide: ClipboardService, useValue: coursesServiceSpy },
                { provide: VhoQueryService, useValue: vhoQueryServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CopyQuickLinkComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        clipboardService = TestBed.inject(ClipboardService);
        vhoQueryService = TestBed.inject(VhoQueryService);
        const conferenceData = new ConferenceResponseVho({
            hearing_id: '555555'
        });
        vhoQueryService.getConferenceByIdVHO.and.returnValue(Promise.resolve(conferenceData));
    });

    afterEach(() => {
        vhoQueryService.getConferenceByIdVHO.calls.reset();
    });

    it('renders icon to copy to clipboard', () => {
        expect(fixture.debugElement.query(By.css('#copy-quick-link'))).toBeTruthy();
    });

    it('copies content into the clipboard using the clipboard service when element is clicked', fakeAsync(() => {
        const baseUrl = 'https://wow';
        spyOn(component, 'getbaseUrl').and.returnValue(baseUrl);
        const copyLinkElement = fixture.debugElement.query(By.css('#copy-quick-link'));
        copyLinkElement.triggerEventHandler('click', {});
        fixture.detectChanges();
        flush();
        const expectedUrl = `${baseUrl}/quickjoin/${component.hearingId}`;
        expect(clipboardService.copyFromContent).toHaveBeenCalledWith(expectedUrl);
    }));

    it('returns base url when calling getbaseurl function', () => {
        const result = component.getbaseUrl();
        fixture.detectChanges();
        expect(result).toBe(window.location.origin);
    });

    it('populates the hearing id once component is mounted', async () => {
        const expectedHearingId = '1234-4564';
        const conferenceData = new ConferenceResponseVho({
            hearing_id: expectedHearingId
        });
        component.conferenceId = 'conferenceId';
        fixture.detectChanges();
        vhoQueryService.getConferenceByIdVHO.and.returnValue(Promise.resolve(conferenceData));
        fixture.detectChanges();
        component.ngOnInit();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(vhoQueryService.getConferenceByIdVHO).toHaveBeenCalledWith(component.conferenceId);
        expect(component.hearingId).toBe(expectedHearingId);
    });
});
