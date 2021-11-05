import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffMemberHearingSelectionComponent } from './staff-member-hearing-selection.component';

describe('StaffMemberHearingSelectionComponent', () => {
  let component: StaffMemberHearingSelectionComponent;
  let fixture: ComponentFixture<StaffMemberHearingSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StaffMemberHearingSelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffMemberHearingSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
