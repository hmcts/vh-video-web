import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';

import { HomeComponent } from './home.component';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { ProfileService } from '../services/api/profile.service';
import { of } from 'rxjs';
import { UserProfileResponse, UserRole } from '../services/clients/api-client';
import { PageUrls } from '../shared/page-url.constants';
import { DeviceType } from '../services/device-type';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;
  let profileServiceSpy: jasmine.SpyObj<ProfileService>;
  let deviceTypeSpy: jasmine.SpyObj<DeviceType>;

  configureTestSuite(() => {
    profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
    deviceTypeSpy = jasmine.createSpyObj<DeviceType>(['isMobile', 'isTablet', 'isDesktop']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [HomeComponent],
      providers: [
        { provide: ProfileService, useValue: profileServiceSpy },
        { provide: DeviceType, useValue: deviceTypeSpy }
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
    deviceTypeSpy.isMobile.and.returnValue(true);
    fixture.detectChanges();

    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    deviceTypeSpy.isTablet.and.returnValue(true);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.SignonAComputer]);
  });
});
