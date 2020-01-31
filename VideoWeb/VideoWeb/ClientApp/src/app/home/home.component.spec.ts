import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { ProfileService } from '../services/api/profile.service';
import { UserProfileResponse, UserRole } from '../services/clients/api-client';
import { DeviceTypeService } from '../services/device-type.service';
import { Logger } from '../services/logging/logger-base';
import { PageUrls } from '../shared/page-url.constants';
import { SharedModule } from '../shared/shared.module';
import { MockLogger } from '../testing/mocks/MockLogger';
import { HomeComponent } from './home.component';


describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;
  let profileServiceSpy: jasmine.SpyObj<ProfileService>;
  let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;

  configureTestSuite(() => {
    profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
    deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(['isMobile', 'isTablet', 'isDesktop']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [HomeComponent],
      providers: [
        { provide: ProfileService, useValue: profileServiceSpy },
        { provide: DeviceTypeService, useValue: deviceTypeServiceSpy },
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

  it('should go to judge hearing list', async () => {
    const profile = new UserProfileResponse({ role: UserRole.Judge });
    component.navigateToHearingList(profile);
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.JudgeHearingList]);
  });

  it('should go to admin hearing list', () => {
    const profile = new UserProfileResponse({ role: UserRole.VideoHearingsOfficer });
    component.navigateToHearingList(profile);
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.AdminHearingList]);
  });

  it('should go to participant hearing list', () => {
    const profile = new UserProfileResponse({ role: UserRole.Representative });
    component.navigateToHearingList(profile);
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.ParticipantHearingList]);
  });

  it('should redirect to signon-a-computer screen if on a mobile device', () => {
    deviceTypeServiceSpy.isDesktop.and.returnValue(false);
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.SignonAComputer]);
  });

  it('should navigate to hearing list when device is a desktop', async (done) => {
    const profile = new UserProfileResponse({ role: UserRole.Representative });
    profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
    deviceTypeServiceSpy.isDesktop.and.returnValue(true);
    spyOn(component, 'navigateToHearingList');

    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.navigateToHearingList).toHaveBeenCalledWith(profile);
    done();
  });
});
