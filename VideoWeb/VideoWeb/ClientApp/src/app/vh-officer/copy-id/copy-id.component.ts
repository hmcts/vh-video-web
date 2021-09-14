import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { VhoQueryService } from '../services/vho-query-service.service';

@Component({
    selector: 'app-copy-id',
    templateUrl: './copy-id.component.html'
})
export class CopyIdComponent implements OnInit {
    @Input() conference: string;
    tooltip: string;
    hearingId: string;
    @ViewChild('copyID', { static: false }) copyID: ElementRef;

    constructor(private clipboardService: ClipboardService, private vhoQueryService: VhoQueryService) {}

    async ngOnInit() {
        this.resetText();
        const response = await this.vhoQueryService.getConferenceByIdVHO(this.conference);
        this.hearingId = response.hearing_id;
    }

    copyToClipboard() {
        this.clipboardService.copyFromContent(this.hearingId);
        this.tooltip = 'Conference ID copied to clipboard';
    }

    resetText() {
        this.tooltip = 'Copy conference ID to clipboard';
    }
}
