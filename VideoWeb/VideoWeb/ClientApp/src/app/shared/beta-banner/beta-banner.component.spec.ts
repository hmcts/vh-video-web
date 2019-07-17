import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { BetaBannerComponent } from './beta-banner.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProfileService } from 'src/app/services/api/profile.service';
import { UserProfileResponse, UserRole } from 'src/app/services/clients/api-client';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({ selector: 'app-mock-component', template: '' })
class Mock1Component {
}

@Component({ selector: 'app-mock-component2', template: '' })
class Mock2Component {
}

const routes =
  [
    { path: 'sub-component1', component: Mock1Component },
    { path: 'sub-component2', component: Mock2Component }
  ];

describe('BetaBannerComponent',
  () => {
    let component: BetaBannerComponent;
    let fixture: ComponentFixture<BetaBannerComponent>;
    let router: Router;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
    const profile = new UserProfileResponse({ role: UserRole.Representative });
    profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          BetaBannerComponent,
          Mock1Component,
          Mock2Component
        ],
        imports: [
          RouterTestingModule.withRoutes(routes)
        ],
        providers: [
          { provide: ProfileService, useValue: profileServiceSpy },
          { provide: Logger, useClass: MockLogger }
        ],
        schemas: [NO_ERRORS_SCHEMA]

      })
        .compileComponents();
    }));

    beforeEach(() => {
      router = TestBed.get(Router);
      fixture = TestBed.createComponent(BetaBannerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('navigate to sub-component1 should see sub-component1 in router url',
      fakeAsync(() => {
        fixture.ngZone.run(() => {
          router.navigate(['sub-component1']);
          tick();
          expect(router.url).toBe('/sub-component1');
          expect(component.pageUrl).toBe('/sub-component1');
        });
      }));
  });
