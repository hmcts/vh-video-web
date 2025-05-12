import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HearingDetailsComponent } from './hearing-details.component';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';
import { TranslateDatePipeMock } from 'src/app/testing/mocks/mock-translate-date-pipe';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';
import { VHHearing } from 'src/app/shared/models/hearing.vh';

describe('HearingDetailsComponent', () => {
    let component: HearingDetailsComponent;
    let fixture: ComponentFixture<HearingDetailsComponent>;

    function createTestConference() {
        const conferenceResponse = new ConferenceTestData().getConferenceDetailNow();
        const conference = mapConferenceToVHConference(conferenceResponse);
        return conference;
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HearingDetailsComponent, TranslatePipeMock, TranslateDatePipeMock]
        }).compileComponents();

        fixture = TestBed.createComponent(HearingDetailsComponent);
        component = fixture.componentInstance;
        component.conference = createTestConference();
        component.hearing = new VHHearing(component.conference);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('stringToTranslateId', () => {
        it('should convert string to translation id', () => {
            // Arrange
            const string = 'Adoption';

            // Act
            const result = component.stringToTranslateId(string);

            // Assert
            expect(result).toBe('adoption');
        });
    });
});
