import { Component, EventEmitter, Output } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
    selector: 'app-individual-consultation-controls',
    templateUrl: './individual-consultation-controls.component.html',
    styleUrls: ['./individual-consultation-controls.component.scss']
})
export class IndividualConsultationControlsComponent {
    @Output() cancelConsulation = new EventEmitter();

    constructor(private logger: Logger) {}

    closeConsultation() {
        this.logger.debug('Consultation clicked close');
        this.cancelConsulation.emit();
    }
}
