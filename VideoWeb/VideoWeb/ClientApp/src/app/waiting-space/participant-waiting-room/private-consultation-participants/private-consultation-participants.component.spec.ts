import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateConsultationParticipantsComponent } from './private-consultation-participants.component';

describe('PrivateConsultationParticipantsComponent', () => {
  let component: PrivateConsultationParticipantsComponent;
  let fixture: ComponentFixture<PrivateConsultationParticipantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivateConsultationParticipantsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivateConsultationParticipantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
