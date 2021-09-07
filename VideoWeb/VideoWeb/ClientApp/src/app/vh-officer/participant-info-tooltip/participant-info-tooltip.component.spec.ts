import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ParticipantContactDetailsResponseVho, Role } from 'src/app/services/clients/api-client';
import { ParticipantContactDetails } from 'src/app/shared/models/participant-contact-details';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';
import { ParticipantInfoTooltipComponent } from './participant-info-tooltip.component';

describe('ParticipantInfoTooltip component', () => {
    let component: ParticipantInfoTooltipComponent;
    let fixture: ComponentFixture<ParticipantInfoTooltipComponent>;
    let translateService: any;

    beforeEach(async () => {
        const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
        await TestBed.configureTestingModule({
            declarations: [ParticipantInfoTooltipComponent, TranslatePipeMock],
            providers: [{ provide: TranslateService, useValue: translateServiceSpy }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantInfoTooltipComponent);
        component = fixture.componentInstance;
        component.participant = new ParticipantContactDetails(
            new ParticipantContactDetailsResponseVho({ role: Role.QuickLinkParticipant, id: '12' })
        );
        fixture.detectChanges();
        translateService = TestBed.inject(TranslateService);
    });

    afterEach(() => {
        translateService.instant.calls.reset();
    });

    it('renders join by quick link text', () => {
        const expectedId = '1234';
        component.participant = new ParticipantContactDetails(
            new ParticipantContactDetailsResponseVho({ role: Role.QuickLinkParticipant, id: expectedId })
        );
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css(`#tooltip-joined-by-quick-link-${expectedId}`))).toBeTruthy();
    });

    it('does not render join by quick link text', () => {
        const expectedId = '1234';
        component.participant = new ParticipantContactDetails(
            new ParticipantContactDetailsResponseVho({ role: Role.Judge, id: expectedId })
        );
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css(`#tooltip-joined-by-quick-link-${expectedId}`))).toBeFalsy();
    });

    it('strips out quick link prefix for quick link particpant hearing role', () => {
        const expectedDisplayText = 'expectedDisplayText';
        component.participant = new ParticipantContactDetails(
            new ParticipantContactDetailsResponseVho({ role: Role.QuickLinkParticipant, id: 'id', hearing_role: 'Quick link participant' })
        );
        translateService.instant.withArgs('participant-info-tooltip.quick-link-participant').and.returnValue(expectedDisplayText);
        fixture.detectChanges();
        const hearingRoleElement = fixture.debugElement.query(By.css('#tooltip-hearing-role-id'));
        expect(hearingRoleElement.nativeElement.innerHTML).toContain(expectedDisplayText);
    });

    it('strips out quick link prefix for quick link observer hearing role', () => {
        const expectedDisplayText = 'expectedDisplayText';
        component.participant = new ParticipantContactDetails(
            new ParticipantContactDetailsResponseVho({ role: Role.QuickLinkObserver, id: 'id', hearing_role: 'Quick link observer' })
        );
        translateService.instant.withArgs('participant-info-tooltip.quick-link-observer').and.returnValue(expectedDisplayText);
        fixture.detectChanges();
        const hearingRoleElement = fixture.debugElement.query(By.css('#tooltip-hearing-role-id'));
        expect(hearingRoleElement.nativeElement.innerHTML).toContain(expectedDisplayText);
    });

    it('returns the normal hearing role for hearing role other than quick links', () => {
        const expectedDisplayText = 'Judge';
        component.participant = new ParticipantContactDetails(
            new ParticipantContactDetailsResponseVho({ role: Role.Judge, id: 'id', hearing_role: expectedDisplayText })
        );
        fixture.detectChanges();
        const hearingRoleElement = fixture.debugElement.query(By.css('#tooltip-hearing-role-id'));
        expect(hearingRoleElement.nativeElement.innerHTML).toContain(expectedDisplayText);
    });
});
