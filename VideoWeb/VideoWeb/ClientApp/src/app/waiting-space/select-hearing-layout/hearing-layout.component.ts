import { Component, Input } from '@angular/core';
import { HearingLayout } from '../models/hearing-layout';

@Component({
    selector: 'app-hearing-layout',
    templateUrl: './hearing-layout.component.html',
    styleUrls: ['./hearing-layout.component.scss']
})
export class HearingLayoutComponent {
    @Input() layout: HearingLayout;
    @Input() recommended: boolean;

    getLayoutImagePath() {
        switch (this.layout) {
            case HearingLayout.OnePlus7:
                return '/assets/images/layout_1_7.png';
            case HearingLayout.TwoPlus21:
                return '/assets/images/layout_2_21.png';
            default:
                return '/assets/images/layout_dynamic.png';
        }
    }

    getLayoutTitle() {
        switch (this.layout) {
            case HearingLayout.OnePlus7:
                return '1 main speaker';
            case HearingLayout.TwoPlus21:
                return '2 main speakers';
            default:
                return 'Dynamic';
        }
    }

    getLayoutDescription() {
        switch (this.layout) {
            case HearingLayout.OnePlus7:
                return 'Up to 7 participants on screen. The current speaker appears in the main window.';
            case HearingLayout.TwoPlus21:
                return 'Up to 21 participants on screen. The current speakers appear in 2 main windows.';
            default:
                return 'Layout automatically adapts to the number of participants.';
        }
    }
}
