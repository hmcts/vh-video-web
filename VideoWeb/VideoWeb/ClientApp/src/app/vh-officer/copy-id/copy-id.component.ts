import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ClipboardService } from 'ngx-clipboard';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-copy-id',
    templateUrl: './copy-id.component.html'
})
export class CopyIdComponent implements OnInit {
    @Input() conference: HearingSummary;
    tooltip: string;
    propertyIdName = 'copy-conference-id';
    @ViewChild('copyID', { static: false }) copyID: ElementRef;

    constructor(private clipboardService: ClipboardService, private translateService: TranslateService) {}

    ngOnInit(): void {
        this.propertyIdName = this.propertyIdName + '-' + this.conference.id;
        this.resetText();
    }

    copyToClipboard(conference: HearingSummary) {
        this.clipboardService.copyFromContent(conference.id);
        this.tooltip = this.translateService.instant('copy-id.tooltip-copied');
    }

    resetText() {
        this.tooltip = this.translateService.instant('copy-id.display-text');
    }
}
