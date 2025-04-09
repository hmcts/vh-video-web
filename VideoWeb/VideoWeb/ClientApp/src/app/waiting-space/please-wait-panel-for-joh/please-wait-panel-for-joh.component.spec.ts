import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PleaseWaitPanelForJohComponent } from './please-wait-panel-for-joh.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VHHearing } from 'src/app/shared/models/hearing.vh';
import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';

describe('PleaseWaitPanelForJohComponent', () => {
    let component: PleaseWaitPanelForJohComponent;
    let fixture: ComponentFixture<PleaseWaitPanelForJohComponent>;

    function createTestHearing() {
        const conferenceResponse = new ConferenceTestData().getConferenceDetailNow();
        const conference = mapConferenceToVHConference(conferenceResponse);
        return new VHHearing(conference);
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PleaseWaitPanelForJohComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PleaseWaitPanelForJohComponent);
        component = fixture.componentInstance;
        component.hearing = createTestHearing();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getCurrentTimeClass', () => {
        it('should return hearing-delayed when conference is suspended', () => {
            spyOn(component.hearing, 'isSuspended').and.returnValue(true);
            expect(component.getCurrentTimeClass()).toBe('hearing-delayed');
        });

        it('should return hearing-on-time when conference is not suspended', () => {
            spyOn(component.hearing, 'isSuspended').and.returnValue(false);
            expect(component.getCurrentTimeClass()).toBe('hearing-on-time');
        });
    });
});
