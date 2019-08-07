import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualConsultationControlsComponent } from './individual-consultation-controls.component';
import { configureTestSuite } from 'ng-bullet';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';

describe('IndividualConsultationControlsComponent', () => {
  let component: IndividualConsultationControlsComponent;
  let fixture: ComponentFixture<IndividualConsultationControlsComponent>;

  configureTestSuite((() => {
    TestBed.configureTestingModule({
      declarations: [IndividualConsultationControlsComponent],
      providers: [
        { provide: Logger, useClass: MockLogger }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualConsultationControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit when consultation has been closed', () => {
    spyOn(component.cancelConsulation, 'emit').and.callFake(() => { });
    component.closeConsultation();
    expect(component.cancelConsulation.emit).toHaveBeenCalled();
  });
});
