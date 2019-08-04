import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualConsultationControlsComponent } from './individual-consultation-controls.component';

describe('IndividualConsultationControlsComponent', () => {
  let component: IndividualConsultationControlsComponent;
  let fixture: ComponentFixture<IndividualConsultationControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IndividualConsultationControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualConsultationControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
