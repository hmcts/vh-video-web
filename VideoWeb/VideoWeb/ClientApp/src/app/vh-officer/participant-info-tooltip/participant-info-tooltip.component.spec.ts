import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ParticipantContactDetailsResponseVho, Role } from 'src/app/services/clients/api-client';
import { ParticipantContactDetails } from 'src/app/shared/models/participant-contact-details';
import { ParticipantInfoTooltipComponent } from './participant-info-tooltip.component';

describe('ParticipantInfoTooltip component', () => {
    let component: ParticipantInfoTooltipComponent;
    let fixture: ComponentFixture<ParticipantInfoTooltipComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ParticipantInfoTooltipComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantInfoTooltipComponent);
        component = fixture.componentInstance;
        component.participant = new ParticipantContactDetails(
            new ParticipantContactDetailsResponseVho({ role: Role.QuickLinkParticipant, id: '12' })
        );
        fixture.detectChanges();
    });

    it('renders join by quick link text', () => {
        const expectedId = '1234';
        component.participant = new ParticipantContactDetails(
            new ParticipantContactDetailsResponseVho({ role: Role.QuickLinkParticipant, id: expectedId })
        );
        fixture.detectChanges();
        const quickLinkTextElement = fixture.debugElement.query(By.css(`#tooltip-joined-by-quick-link-${expectedId}`));
        expect(quickLinkTextElement.nativeElement.innerHTML).toBe(component.joinByQuickLinkText);
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
        component.participant = new ParticipantContactDetails(
            new ParticipantContactDetailsResponseVho({ role: Role.QuickLinkParticipant, id: 'id', hearing_role: 'Quick link participant' })
        );
        fixture.detectChanges();
        const hearingRoleElement = fixture.debugElement.query(By.css('#tooltip-hearing-role-id'));
        expect(hearingRoleElement.nativeElement.innerHTML).toContain(component.quickLinkParticipantDisplayText);
    });

    it('strips out quick link prefix for quick link observer hearing role', () => {
        component.participant = new ParticipantContactDetails(
            new ParticipantContactDetailsResponseVho({ role: Role.QuickLinkObserver, id: 'id', hearing_role: 'Quick link observer' })
        );
        fixture.detectChanges();
        const hearingRoleElement = fixture.debugElement.query(By.css('#tooltip-hearing-role-id'));
        expect(hearingRoleElement.nativeElement.innerHTML).toContain(component.quickLinkObserverDisplayText);
    });

    it('returns the normal hearing role for user role other than quick link users', () => {
        const expectedDisplayText = 'Judge';
        component.participant = new ParticipantContactDetails(
            new ParticipantContactDetailsResponseVho({ role: Role.Judge, id: 'id', hearing_role: expectedDisplayText })
        );
        fixture.detectChanges();
        const hearingRoleElement = fixture.debugElement.query(By.css('#tooltip-hearing-role-id'));
        expect(hearingRoleElement.nativeElement.innerHTML).toContain(expectedDisplayText);
    });
});
