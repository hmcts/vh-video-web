import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TranslateService } from '@ngx-translate/core';
import { MockComponent } from 'ng-mocks';
import { ClipboardService } from 'ngx-clipboard';
import { ConferenceResponseVho } from 'src/app/services/clients/api-client';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';
import { VhoQueryService } from '../services/vho-query-service.service';
import { CopyQuickLinkComponent } from './copy-quick-link.component';

describe('CopyQuickLinkComponent', () => {
    let component: CopyQuickLinkComponent;
    let fixture: ComponentFixture<CopyQuickLinkComponent>;
    let clipboardService: any;
    let vhoQueryService: any;
    let translateService: any;
    const testConferenceId = 'test';
    const testHearingId = 'testHearingId';
    const elementName = `#copy-quick-link-${testConferenceId}`;
    let copyLinkElement: DebugElement;

    beforeEach(async () => {
        const clipboardServiceSpy = jasmine.createSpyObj('ClipboardService', ['copyFromContent']);
        const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);

        await TestBed.configureTestingModule({
            declarations: [CopyQuickLinkComponent, TranslatePipeMock, MockComponent(FaIconComponent)],
            providers: [
                { provide: ClipboardService, useValue: clipboardServiceSpy },
                { provide: TranslateService, useValue: translateServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CopyQuickLinkComponent);
        component = fixture.componentInstance;
        component.conferenceId = testConferenceId;
        component.hearingId = testHearingId;
        fixture.detectChanges();
        clipboardService = TestBed.inject(ClipboardService);
        translateService = TestBed.inject(TranslateService);

        copyLinkElement = fixture.debugElement.query(By.css(elementName));
    });

    afterEach(() => {
        translateService.instant.calls.reset();
    });

    it('renders icon to copy to clipboard', () => {
        expect(copyLinkElement).toBeTruthy();
    });

    it('copies content into the clipboard using the clipboard service when element is clicked', fakeAsync(() => {
        const baseUrl = 'https://wow';
        spyOn(component, 'getbaseUrl').and.returnValue(baseUrl);
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
