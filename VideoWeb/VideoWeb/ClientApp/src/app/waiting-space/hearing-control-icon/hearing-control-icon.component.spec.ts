import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HearingControlIconComponent } from './hearing-control-icon.component';

describe('HearingControlIconComponent', () => {
  let component: HearingControlIconComponent;
  let fixture: ComponentFixture<HearingControlIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HearingControlIconComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HearingControlIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
