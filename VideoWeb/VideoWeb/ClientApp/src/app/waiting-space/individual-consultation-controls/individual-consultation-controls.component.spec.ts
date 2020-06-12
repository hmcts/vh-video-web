import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { IndividualConsultationControlsComponent } from './individual-consultation-controls.component';

describe('IndividualConsultationControlsComponent', () => {
    let component: IndividualConsultationControlsComponent;
    const logger: Logger = new MockLogger();

    beforeEach(() => {
        component = new IndividualConsultationControlsComponent(logger);
    });

    it('should emit when consultation has been closed', () => {
        spyOn(component.cancelConsulation, 'emit').and.callFake(() => {});
        component.closeConsultation();
        expect(component.cancelConsulation.emit).toHaveBeenCalled();
    });
});
