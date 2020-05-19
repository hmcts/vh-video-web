import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { BackNavigationStubComponent } from 'src/app/testing/stubs/back-navigation-stub';
import { ContactUsFoldingStubComponent } from 'src/app/testing/stubs/contact-us-stub';
import { EquipmentCheckComponent } from './equipment-check.component';

describe('EquipmentCheckComponent', () => {
    let component: EquipmentCheckComponent;
    let fixture: ComponentFixture<EquipmentCheckComponent>;
    let debugElement: DebugElement;
    let router: Router;
    const conference = new ConferenceTestData().getConferenceDetailFuture();

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            declarations: [EquipmentCheckComponent, ContactUsFoldingStubComponent, BackNavigationStubComponent],
            imports: [ReactiveFormsModule, FormsModule, RouterTestingModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ conferenceId: conference.id })
                        }
                    }
                },
                { provide: Logger, useClass: MockLogger }
            ]
        });

        fixture = TestBed.createComponent(EquipmentCheckComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        router = TestBed.get(Router);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EquipmentCheckComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should navigate to camera-and-microphone', () => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        component.goToCameraAndMicCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.SwitchOnCameraMicrophone, conference.id]);
    });
});
