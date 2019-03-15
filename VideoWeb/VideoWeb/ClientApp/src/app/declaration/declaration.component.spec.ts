import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DeclarationComponent } from './declaration.component';
import { Router } from '@angular/router';
import { DebugElement } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { By } from '@angular/platform-browser';

describe('DeclarationComponent Tests', () => {
  let component: DeclarationComponent;
  let fixture: ComponentFixture<DeclarationComponent>;
  let debugElement: DebugElement;
  let input: HTMLInputElement;
  const routerSpy = {
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeclarationComponent],
      imports: [ReactiveFormsModule, FormsModule],
      providers: [{ provide: Router, useValue: routerSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(DeclarationComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;
    input = fixture.debugElement.query(By.css('#declare')).nativeElement;
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(DeclarationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should the checklist be unchecked', () => {
    fixture.detectChanges();
    expect(component.declarationForm.invalid).toBeTruthy();
    component.onSubmit();
    expect(routerSpy.navigate).toHaveBeenCalledTimes(0);
  });

  it('should the checklist be checked', () => {
    input.click();
    fixture.detectChanges();
    expect(input.checked).toBeTruthy();
    component.onSubmit();
    expect(routerSpy.navigate).toHaveBeenCalledWith('/');
  });

  it('should click change value', () => {
    expect(input.checked).toBeFalsy(); // default state

    input.click();
    fixture.detectChanges();

    expect(input.checked).toBeTruthy(); // state after click
  });
});
