import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoHearingsComponent } from './no-hearings.component';
import { DebugElement } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';

describe('NoHearingsComponent', () => {
  let component: NoHearingsComponent;
  let fixture: ComponentFixture<NoHearingsComponent>;
  let debugElement: DebugElement;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NoHearingsComponent],
      imports: [ReactiveFormsModule, FormsModule, RouterTestingModule, SharedModule],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoHearingsComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;
    router = TestBed.get(Router);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoHearingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
