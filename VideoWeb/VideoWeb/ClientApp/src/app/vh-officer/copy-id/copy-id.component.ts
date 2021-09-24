import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ClipboardService } from 'ngx-clipboard';

@Component({
    selector: 'app-copy-id',
    templateUrl: './copy-id.component.html'
})
export class CopyIdComponent implements OnInit {
    @Input() conference: HearingSummary;
    tooltip: string;
    propertyIdName = 'copy-conference-id';
    @ViewChild('copyID', { static: false }) copyID: ElementRef;

    constructor(private clipboardService: ClipboardService) {}

    ngOnInit(): void {
        this.propertyIdName = this.propertyIdName + '-' + this.conference.id;
        this.resetText();
    }

    copyToClipboard(conference: HearingSummary) {
        this.clipboardService.copyFromContent(conference.id);
        this.tooltip = 'Conference ID copied to clipboard';
    }

    resetText() {
        this.tooltip = 'Copy conference ID to clipboard';
    }
}
