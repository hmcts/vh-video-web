import { Component, Input } from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-context-menu-header',
    templateUrl: './context-menu-header.component.html'
})
export class ContextMenuHeaderComponent {
    @Input() public isPrivateConsultation: boolean;
}
