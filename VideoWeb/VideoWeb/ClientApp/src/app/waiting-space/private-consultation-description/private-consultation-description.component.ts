import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-private-consultation-description',
    standalone: false,
    templateUrl: './private-consultation-description.component.html'
})
export class PrivateConsultationDescriptionComponent {
    @Input() isExpanded = false;
    @Output() accordianToggled = new EventEmitter<void>();

    toggleAccordian() {
        this.accordianToggled.emit();
    }
}
