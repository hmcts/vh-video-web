import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ParticipantContactDetails } from 'src/app/shared/models/participant-contact-details';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';

import { ParticipantInfoTooltipComponent } from './participant-info-tooltip.component';
import {TranslateService} from "@ngx-translate/core";
import {translateServiceSpy} from "../../testing/mocks/mock-translation.service";

describe('ParticipantInfoTooltipComponent', () => {
    let component: ParticipantInfoTooltipComponent;

    let fixture: ComponentFixture<ParticipantInfoTooltipComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ParticipantInfoTooltipComponent],
            providers : [{provide: TranslateService, useValue: translateServiceSpy}]
        });

        fixture = TestBed.createComponent(ParticipantInfoTooltipComponent);
        component = fixture.componentInstance;
    });

    it('should show case type group', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        component.participant = new ParticipantContactDetails(participant);

        spyOnProperty(component.participant, 'showCaseRole', 'get').and.returnValue(true);
        fixture.detectChanges();

        const showCaseRoleElement = fixture.debugElement.query(By.css(`#tooltip-case-role-${component.participant.id}`));

        expect(showCaseRoleElement).toBeTruthy();
    });

    it('should not show case type group', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        component.participant = new ParticipantContactDetails(participant);

        spyOnProperty(component.participant, 'showCaseRole', 'get').and.returnValue(false);
        fixture.detectChanges();

        const showCaseRoleElement = fixture.debugElement.query(By.css(`#tooltip-case-role-${component.participant.id}`));

        expect(showCaseRoleElement).toBeFalsy();
    });
});
