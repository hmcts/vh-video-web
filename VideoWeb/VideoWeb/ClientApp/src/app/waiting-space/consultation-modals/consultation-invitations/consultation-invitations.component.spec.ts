import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationInvitationsComponent } from './consultation-invitations.component';

describe('ConsultationInvitationsComponent', () => {
  let component: ConsultationInvitationsComponent;
  let fixture: ComponentFixture<ConsultationInvitationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConsultationInvitationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsultationInvitationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
