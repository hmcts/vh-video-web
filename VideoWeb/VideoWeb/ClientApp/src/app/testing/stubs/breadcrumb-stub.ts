import { Component, Input } from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-breadcrumb',
    template: ''
})
export class BreadcrumbStubComponent {
    @Input()
    canNavigate = true;
}
