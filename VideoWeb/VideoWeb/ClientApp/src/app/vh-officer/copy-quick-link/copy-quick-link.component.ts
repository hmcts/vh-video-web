import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ClipboardService } from 'ngx-clipboard';

@Component({
    standalone: false,
    selector: 'app-copy-quick-link',
    templateUrl: './copy-quick-link.component.html'
})
export class CopyQuickLinkComponent implements OnInit {
    @Input() conferenceId: string;
    @Input() hearingId: string;
    tooltip: string;
    propertyIdName = 'copy-quick-link';

    constructor(
        private clipBoardService: ClipboardService,
        private translateService: TranslateService
    ) {}

    async ngOnInit() {
        this.propertyIdName = this.propertyIdName + '-' + this.conferenceId;
        this.tooltip = this.translateService.instant('copy-quick-link.display-text');
    }

    copyToClipboard() {
        this.clipBoardService.copyFromContent(`${this.getbaseUrl()}/quickjoin/${this.hearingId}`);
        this.tooltip = this.translateService.instant('copy-quick-link.tooltip-copied');
    }

    getbaseUrl() {
        return window.location.origin;
    }

    resetTooltipText() {
        this.tooltip = this.translateService.instant('copy-quick-link.display-text');
    }
}
