import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ClipboardService } from 'ngx-clipboard';
import { VhoQueryService } from '../services/vho-query-service.service';

@Component({
    selector: 'app-copy-quick-link',
    templateUrl: './copy-quick-link.component.html'
})
export class CopyQuickLinkComponent implements OnInit, OnChanges {
    @Input() conferenceId: string;
    hearingId: string;
    tooltip: string;

    constructor(
        private clipBoardService: ClipboardService,
        private vhoQueryService: VhoQueryService,
        private translateService: TranslateService
    ) {}

    async ngOnInit() {
        this.tooltip = this.translateService.instant('copy-quick-link.display-text');
        const response = await this.vhoQueryService.getConferenceByIdVHO(this.conferenceId);
        this.hearingId = response.hearing_id;
    }

    async ngOnChanges(): Promise<void> {
        const response = await this.vhoQueryService.getConferenceByIdVHO(this.conferenceId);
        this.hearingId = response.hearing_id;
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
