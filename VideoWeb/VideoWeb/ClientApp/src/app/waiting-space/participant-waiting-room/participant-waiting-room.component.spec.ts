import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantWaitingRoomComponent } from './participant-waiting-room.component';
import { ParticipantStatusListStubComponent } from 'src/app/testing/stubs/participant-status-list-stub';

describe('ParticipantWaitingRoomComponent', () => {
  let component: ParticipantWaitingRoomComponent;
  let fixture: ComponentFixture<ParticipantWaitingRoomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantWaitingRoomComponent, ParticipantStatusListStubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantWaitingRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
