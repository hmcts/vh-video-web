import { Component, Input } from '@angular/core';

@Component({ selector: 'app-header', template: '' })
export class HeaderStubComponent {
    @Input() loggedIn: boolean;
}
