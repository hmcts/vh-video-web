import { Component, Input, OnInit } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { VhoQueryService } from '../services/vho-query-service.service';

@Component({
    selector: 'app-copy-quick-link',
    templateUrl: './copy-quick-link.component.html',
    styleUrls: ['./copy-quick-link.component.scss']
})
export class CopyQuickLinkComponent implements OnInit {
    @Input() conferenceId: string;
    hearingId: string;

    constructor(private clipBoardService: ClipboardService, private vhoQueryService: VhoQueryService) {}

    async ngOnInit() {
        const response = await this.vhoQueryService.getConferenceByIdVHO(this.conferenceId);
        this.hearingId = response && response.hearing_id;
    }

    copyToClipboard() {
        this.clipBoardService.copyFromContent(`${this.getbaseUrl()}/quickjoin/${this.hearingId}`);
    }

    getbaseUrl() {
        return window.location.origin;
    }
}
