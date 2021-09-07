import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ClipboardService } from 'ngx-clipboard';
import { ConferenceResponseVho } from 'src/app/services/clients/api-client';
import { VhoQueryService } from '../services/vho-query-service.service';
import { CopyQuickLinkComponent } from './copy-quick-link.component';

describe('CopyQuickLinkComponent', () => {
    let component: CopyQuickLinkComponent;
    let fixture: ComponentFixture<CopyQuickLinkComponent>;
    let clipboardService: any;
    let vhoQueryService: any;
    let translateService: any;

    beforeEach(async () => {
        const coursesServiceSpy = jasmine.createSpyObj('ClipboardService', ['copyFromContent']);
        const vhoQueryServiceSpy = jasmine.createSpyObj('VhoQueryService', ['getConferenceByIdVHO']);
        const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);

        await TestBed.configureTestingModule({
            declarations: [CopyQuickLinkComponent],
            providers: [
                { provide: ClipboardService, useValue: coursesServiceSpy },
                { provide: VhoQueryService, useValue: vhoQueryServiceSpy },
                { provide: TranslateService, useValue: translateServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CopyQuickLinkComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        clipboardService = TestBed.inject(ClipboardService);
        vhoQueryService = TestBed.inject(VhoQueryService);
        translateService = TestBed.inject(TranslateService);
        const conferenceData = new ConferenceResponseVho({
            hearing_id: '555555'
        });
        vhoQueryService.getConferenceByIdVHO.and.returnValue(Promise.resolve(conferenceData));
    });

    afterEach(() => {
        vhoQueryService.getConferenceByIdVHO.calls.reset();
        translateService.instant.calls.reset();
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

    it('updates tooltip text when copy to clipboard is invoked', () => {
        component.tooltip = '';
        const expectedToolTipValue = 'expected value';
        translateService.instant.and.returnValue(expectedToolTipValue);
        component.copyToClipboard();
        expect(component.tooltip).toBe(expectedToolTipValue);
        expect(translateService.instant).toHaveBeenCalledWith('copy-quick-link.tooltip-copied');
    });

    it('sets the tooltip text when component is mounted', async () => {
        const expectedToolTipValue = 'expected value';
        translateService.instant.and.returnValue(expectedToolTipValue);
        component.ngOnInit();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.tooltip).toBe(expectedToolTipValue);
        expect(translateService.instant).toHaveBeenCalledWith('copy-quick-link.display-text');
    });

    it('resets text when reset is invoked', () => {
        component.tooltip = 'some other text';
        const expectedToolTipValue = 'expected value';
        translateService.instant.and.returnValue(expectedToolTipValue);
        component.resetTooltipText();
        expect(component.tooltip).toBe(expectedToolTipValue);
        expect(translateService.instant).toHaveBeenCalledWith('copy-quick-link.display-text');
    });
});
