import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraAndMicrophoneComponent } from './camera-and-microphone.component';

describe('CameraAndMicrophoneComponent', () => {
  let component: CameraAndMicrophoneComponent;
  let fixture: ComponentFixture<CameraAndMicrophoneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CameraAndMicrophoneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraAndMicrophoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
