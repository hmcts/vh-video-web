import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceDownBannerComponent } from './service-down-banner.component';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { of } from 'rxjs';
import { MockPipe } from 'ng-mocks';
import { TranslatePipe } from '@ngx-translate/core';

describe('ServiceDownBannerComponent', () => {
    let component: ServiceDownBannerComponent;
    let fixture: ComponentFixture<ServiceDownBannerComponent>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;

    const serviceUpdateText = 'Service is down for maintenance.';

    beforeEach(async () => {
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.serviceUpdateText).and.returnValue(of(serviceUpdateText));

        await TestBed.configureTestingModule({
            declarations: [ServiceDownBannerComponent, MockPipe(TranslatePipe)],
            providers: [
                {
                    provide: LaunchDarklyService,
                    useValue: launchDarklyServiceSpy
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ServiceDownBannerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('OnInit', () => {
        it('should set serviceDownBannerText to the value from LaunchDarklyService', () => {
            expect(component.serviceDownBannerText).toBe(serviceUpdateText);
        });
    });

    afterEach(() => {
        component.ngOnDestroy();
    });
});
