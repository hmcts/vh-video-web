import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HearingLayout } from 'src/app/services/clients/api-client';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-hearing-layout',
    templateUrl: './hearing-layout.component.html',
    styleUrls: ['./hearing-layout.component.scss']
})
export class HearingLayoutComponent {
    @Input() layout: HearingLayout;
    @Input() recommended: boolean;
    @Input() showInput = true;
    @Input() isSelected: boolean;
    @Output() selectedEvent = new EventEmitter();
    headerLayoutTitlePrefix = 'hearing-layout-title-';
    headerLayoutDescriptionPrefix = 'hearing-layout-description-';

    constructor(private translateService: TranslateService) {}

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
                return this.translateService.instant('hearing-layout.title-1-plus-7');
            case HearingLayout.TwoPlus21:
                return this.translateService.instant('hearing-layout.title-2-plus-21');
            case HearingLayout.NineEqual:
                return this.translateService.instant('hearing-layout.title-nine-equal');
            case HearingLayout.SixteenEqual:
                return this.translateService.instant('hearing-layout.title-sixteen-equal');
            case HearingLayout.TwentyFiveEqual:
                return this.translateService.instant('hearing-layout.title-twenty-five-equal');
            default:
                return this.translateService.instant('hearing-layout.title-dynamic');
        }
    }

    getLayoutDescription() {
        switch (this.layout) {
            case HearingLayout.OnePlus7:
                return this.translateService.instant('hearing-layout.description-1-plus-7');
            case HearingLayout.TwoPlus21:
                return this.translateService.instant('hearing-layout.description-2-plus-21');
            case HearingLayout.NineEqual:
                return this.translateService.instant('hearing-layout.description-nine-equal');
            case HearingLayout.SixteenEqual:
                return this.translateService.instant('hearing-layout.description-sixteen-equal');
            case HearingLayout.TwentyFiveEqual:
                return this.translateService.instant('hearing-layout.description-twenty-five-equal');
            default:
                return this.translateService.instant('hearing-layout.description-dynamic');
        }
    }

    emitSelected() {
        this.selectedEvent.emit();
    }
}
