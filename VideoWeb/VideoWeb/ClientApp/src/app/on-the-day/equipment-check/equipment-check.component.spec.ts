import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentCheckComponent } from './equipment-check.component';
import { DebugElement } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';

describe('EquipmentCheckComponent', () => {
  let component: EquipmentCheckComponent;
  let fixture: ComponentFixture<EquipmentCheckComponent>;
  let debugElement: DebugElement;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EquipmentCheckComponent],
      imports: [ReactiveFormsModule, FormsModule, RouterTestingModule, SharedModule],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentCheckComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;
    router = TestBed.get(Router);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EquipmentCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to camera-and-microphone', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.CameraAndMicrophone]);
  });
});
