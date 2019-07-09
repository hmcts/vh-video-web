import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { of } from 'rxjs';
import { ProfileService } from '../services/api/profile.service';
import { UserProfileResponse, UserRole } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';
import { PageUrls } from '../shared/page-url.constants';
import { DeviceTypeService } from '../services/device-type.service';
import { SharedModule } from '../shared/shared.module';
import { MockLogger } from '../testing/mocks/MockLogger';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;
  let profileServiceSpy: jasmine.SpyObj<ProfileService>;
  let deviceTypeSpy: jasmine.SpyObj<DeviceTypeService>;

  configureTestSuite(() => {
    profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
    deviceTypeSpy = jasmine.createSpyObj<DeviceTypeService>(['isMobile', 'isTablet', 'isDesktop']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [HomeComponent],
      providers: [
        { provide: ProfileService, useValue: profileServiceSpy },
        { provide: DeviceTypeService, useValue: deviceTypeSpy },
        { provide: Logger, useClass: MockLogger }
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    spyOn(router, 'navigate').and.returnValue(true);
  });

  it('should go to judge hearing list', () => {
    const profile = new UserProfileResponse({ role: UserRole.Judge });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    deviceTypeSpy.isDesktop.and.returnValue(true);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.JudgeHearingList]);
  });

  it('should go to admin hearing list', () => {
    const profile = new UserProfileResponse({ role: UserRole.VideoHearingsOfficer });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    deviceTypeSpy.isDesktop.and.returnValue(true);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.AdminHearingList]);
  });

  it('should go to participant hearing list', () => {
    const profile = new UserProfileResponse({ role: UserRole.Representative });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    deviceTypeSpy.isDesktop.and.returnValue(true);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.ParticipantHearingList]);
  });

  it('should redirect to signon-a-computer screen if on a mobile device', () => {
    const profile = new UserProfileResponse({ role: UserRole.Representative });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    deviceTypeSpy.isDesktop.and.returnValue(false);
    deviceTypeSpy.isMobile.and.returnValue(true);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.SignonAComputer]);
  });

  it('should redirect to signon-a-computer screen if on a tablet', () => {
    const profile = new UserProfileResponse({ role: UserRole.Representative });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    deviceTypeSpy.isDesktop.and.returnValue(false);
    deviceTypeSpy.isTablet.and.returnValue(true);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.SignonAComputer]);
  });
});
