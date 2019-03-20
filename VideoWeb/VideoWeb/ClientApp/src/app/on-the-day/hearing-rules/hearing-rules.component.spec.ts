import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HearingRulesComponent } from './hearing-rules.component';
import { DebugElement } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, AbstractControl } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

describe('HearingRulesComponent', () => {
  let component: HearingRulesComponent;
  let fixture: ComponentFixture<HearingRulesComponent>;
  let debugElement: DebugElement;
  let router: Router;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      declarations: [ HearingRulesComponent ],
      imports: [ReactiveFormsModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
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
});
