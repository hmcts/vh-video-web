import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-private-consultation-legal-rep-terms-of-service',
    templateUrl: './private-consultation-legal-rep-terms-of-service.component.html'
})
export class PrivateConsultationLegalRepTermsOfServiceComponent {
    @Output() acknowledged = new EventEmitter();
    @Output() cancelled = new EventEmitter();

    onCancel() {
        this.cancelled.emit();
    }

    onAcknowledge() {
        this.acknowledged.emit();
    }
}
