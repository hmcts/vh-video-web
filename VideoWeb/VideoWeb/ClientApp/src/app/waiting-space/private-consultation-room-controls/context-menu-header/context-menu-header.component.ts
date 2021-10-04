import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-context-menu-header',
    templateUrl: './context-menu-header.component.html',
    styleUrls: ['./context-menu-header.component.scss']
})
export class ContextMenuHeaderComponent {
    @Input() public isPrivateConsultation: boolean;
}
