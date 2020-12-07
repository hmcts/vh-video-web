import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JohWaitingRoomComponent } from './joh-waiting-room.component';

describe('JohWaitingRoomComponent', () => {
  let component: JohWaitingRoomComponent;
  let fixture: ComponentFixture<JohWaitingRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JohWaitingRoomComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JohWaitingRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
