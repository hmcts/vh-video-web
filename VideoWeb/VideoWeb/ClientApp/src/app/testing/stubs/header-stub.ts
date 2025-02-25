import { Component, Input } from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-header',
    template: ''
})
export class HeaderStubComponent {
    @Input() loggedIn: boolean;
}
