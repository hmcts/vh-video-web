import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantsPanelItemComponent } from './participants-panel-item.component';

describe('ParticipantsPanelItemComponent', () => {
  let component: ParticipantsPanelItemComponent;
  let fixture: ComponentFixture<ParticipantsPanelItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParticipantsPanelItemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParticipantsPanelItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
