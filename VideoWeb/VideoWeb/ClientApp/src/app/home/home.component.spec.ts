import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { ProfileService } from '../services/profile.service';
import { of } from 'rxjs';
import { UserProfileResponse } from '../services/clients/api-client';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;
  let profileServiceSpy: jasmine.SpyObj<ProfileService>;

  beforeEach(async(() => {
    profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [HomeComponent],
      providers: [
        { provide: ProfileService, useValue: profileServiceSpy }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    spyOn(router, 'navigate').and.returnValue(true);
  });

  it('should go to judge hearing list', () => {
    const profile = new UserProfileResponse({ role: 'Judge' });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['judge/hearing-list']);
  });

  it('should go to admin hearing list', () => {
    const profile = new UserProfileResponse({ role: 'VhOfficer' });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['admin/hearing-list']);
  });

  it('should go to participant hearing list', () => {
    const profile = new UserProfileResponse({ role: 'Representative' });
    profileServiceSpy.getUserProfile.and.returnValue(of(profile));
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['participant/hearing-list']);
  });
});
