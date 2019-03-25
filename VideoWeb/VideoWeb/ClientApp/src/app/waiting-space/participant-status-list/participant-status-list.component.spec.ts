import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantStatusListComponent } from './participant-status-list.component';

describe('ParticipantStatusListComponent', () => {
  let component: ParticipantStatusListComponent;
  let fixture: ComponentFixture<ParticipantStatusListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantStatusListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantStatusListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
