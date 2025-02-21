import { Component, Input } from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-self-view',
    templateUrl: './self-view.component.html',
    styleUrls: ['./self-view.component.scss']
})
export class SelfViewComponent {
    @Input() isOpen: boolean;
    @Input() videoSource: URL | MediaStream;
    @Input() showSpotlightedBorder: boolean;
}
