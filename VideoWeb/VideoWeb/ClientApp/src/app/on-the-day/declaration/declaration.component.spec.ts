import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DeclarationComponent } from './declaration.component';
import { Router } from '@angular/router';
import { DebugElement } from '@angular/core';
import { ReactiveFormsModule, FormsModule, AbstractControl } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from 'src/app/shared/shared.module';

describe('DeclarationComponent Tests', () => {
  let component: DeclarationComponent;
  let fixture: ComponentFixture<DeclarationComponent>;
  let checkboxControl: AbstractControl;
  let debugElement: DebugElement;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeclarationComponent],
      imports: [ReactiveFormsModule, FormsModule, RouterTestingModule, SharedModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DeclarationComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;
    router = TestBed.get(Router);
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(DeclarationComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();

    checkboxControl = component.declarationForm.controls['declare'];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

 it('should invalidate form when declaration is not checked', () => {
    expect(checkboxControl.valid).toBeFalsy();
    checkboxControl.setValue(false);
    expect(checkboxControl.valid).toBeFalsy();
  });

  it('should validate form when declaration is checked', () => {
    expect(checkboxControl.valid).toBeFalsy();
    checkboxControl.setValue(true);
    expect(checkboxControl.valid).toBeTruthy();
  });
});
