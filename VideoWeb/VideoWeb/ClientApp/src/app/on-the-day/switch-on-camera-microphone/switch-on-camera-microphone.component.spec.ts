import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone.component';

describe('SwitchOnCameraMicrophoneComponent', () => {
  let component: SwitchOnCameraMicrophoneComponent;
  let fixture: ComponentFixture<SwitchOnCameraMicrophoneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwitchOnCameraMicrophoneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchOnCameraMicrophoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
