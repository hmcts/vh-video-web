import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarnJoinHearingPopupComponent } from './warn-join-hearing-popup.component';

describe('WarnJoinHearingPopupComponent', () => {
  let component: WarnJoinHearingPopupComponent;
  let fixture: ComponentFixture<WarnJoinHearingPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarnJoinHearingPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WarnJoinHearingPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
