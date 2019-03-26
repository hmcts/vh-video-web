import { Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ContactUsStubComponent } from 'src/app/testing/stubs/contact-us-stub';
import { DashboardStubComponent } from 'src/app/testing/stubs/dashboard-stub';

import { FooterComponent } from './footer.component';


describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let location: Location;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FooterComponent, DashboardStubComponent,
        ContactUsStubComponent],
      imports: [RouterTestingModule.withRoutes([{ path: 'dashboard', component: DashboardStubComponent },
      { path: 'contact-us', component: ContactUsStubComponent }])],
      schemas: [NO_ERRORS_SCHEMA]

    })
      .compileComponents();
  }));

  beforeEach(() => {
    router = TestBed.get(Router);
    location = TestBed.get(Location);
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigate to dashboard you should see contact us link in the footer', fakeAsync(() => {
    fixture.ngZone.run(() => {
      router.navigate(['dashboard']);
    });
    tick();
    expect(location.path()).toBe('/dashboard');
    expect(component.hideContactUsLink).toBeFalsy();
  }));
  it('navigate to contact-us you should not see contact us link in the footer', fakeAsync(() => {
    fixture.ngZone.run(() => {
      router.navigate(['contact-us']);
    });
    tick();
    expect(location.path()).toBe('/contact-us');
    expect(component.hideContactUsLink).toBeTruthy();
  }));
});
