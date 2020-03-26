import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ContactUsFoldingComponent } from './contact-us-folding.component';

describe('ContactUsFoldingComponent', () => {
    let component: ContactUsFoldingComponent;

    beforeEach(() => {
        component = new ContactUsFoldingComponent();
    });

    it('should toggle when pressed', () => {
        component.expanded = false;
        component.toggle();
        expect(component.expanded).toBe(true);
        component.toggle();
        expect(component.expanded).toBe(false);
    });
});
