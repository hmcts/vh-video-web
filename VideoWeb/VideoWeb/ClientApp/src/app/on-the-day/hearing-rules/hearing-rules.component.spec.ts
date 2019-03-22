import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HearingRulesComponent } from './hearing-rules.component';
import { DebugElement } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, AbstractControl } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';

describe('HearingRulesComponent', () => {
  let component: HearingRulesComponent;
  let fixture: ComponentFixture<HearingRulesComponent>;
  let debugElement: DebugElement;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HearingRulesComponent],
      imports: [ReactiveFormsModule, FormsModule, RouterTestingModule, SharedModule],
    })
    .compileComponents();

    fixture = TestBed.createComponent(HearingRulesComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;
    router = TestBed.get(Router);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('next button should work', () => {
    spyOn(component, 'onSubmit');
    component.onSubmit();
    expect(component.onSubmit).toHaveBeenCalled();
  });

  it('should navigate to declaration', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.Declaration]);
  });
});
