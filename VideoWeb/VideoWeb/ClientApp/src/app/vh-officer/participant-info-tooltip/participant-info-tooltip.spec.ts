import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ParticipantContactDetails } from 'src/app/shared/models/participant-contact-details';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';

import { ParticipantInfoTooltipComponent } from './participant-info-tooltip.component';

describe('ParticipantInfoTooltipComponent', () => {
    let component: ParticipantInfoTooltipComponent;

    let fixture: ComponentFixture<ParticipantInfoTooltipComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ParticipantInfoTooltipComponent]
        });

        fixture = TestBed.createComponent(ParticipantInfoTooltipComponent);
        component = fixture.componentInstance;
    });

    fit('should show case type group', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        component.participant = new ParticipantContactDetails(participant);

        spyOnProperty(component.participant, 'showCaseRole', 'get').and.returnValue(true);
        fixture.detectChanges();

        const showCaseRoleElement = fixture.debugElement.query(By.css('[data-case-role]'));

        expect(showCaseRoleElement).toBeTruthy();
    });

    fit('should show case type group', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        component.participant = new ParticipantContactDetails(participant);

        spyOnProperty(component.participant, 'showCaseRole', 'get').and.returnValue(false);
        fixture.detectChanges();

        const showCaseRoleElement = fixture.debugElement.query(By.css('[data-case-role]'));

        expect(showCaseRoleElement).toBeFalsy();
    });
});
