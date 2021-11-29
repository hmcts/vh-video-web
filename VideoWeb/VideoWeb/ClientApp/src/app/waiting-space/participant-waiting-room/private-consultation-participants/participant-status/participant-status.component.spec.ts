import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantStatusComponent } from './participant-status.component';

describe('ParticipantStatusComponent', () => {
  let component: ParticipantStatusComponent;
  let fixture: ComponentFixture<ParticipantStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParticipantStatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
