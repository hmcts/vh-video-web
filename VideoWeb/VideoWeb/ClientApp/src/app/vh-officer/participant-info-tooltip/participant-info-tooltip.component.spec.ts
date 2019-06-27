import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantInfoTooltipComponent } from './participant-info-tooltip.component';

describe('ParticipantInfoTooltipComponent', () => {
  let component: ParticipantInfoTooltipComponent;
  let fixture: ComponentFixture<ParticipantInfoTooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantInfoTooltipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantInfoTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
