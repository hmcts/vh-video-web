import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ClipboardService } from 'ngx-clipboard';

@Component({
    selector: 'app-copy-id',
    templateUrl: './copy-id.component.html',
    styleUrls: ['./copy-id.component.scss']
})
export class CopyIdComponent implements OnInit {
    @Input() conference: HearingSummary;
    displayTooltip: boolean;
    tooltip: string;
    @ViewChild('copyID', { static: false }) copyID: ElementRef;

    constructor(private clipboardService: ClipboardService) {}

    ngOnInit(): void {
        this.displayTooltip = true;
        this.tooltip = 'Copy conference ID to clipboard';
    }

    onMouseOver($event: MouseEvent): void {
        if (!this.copyID) {
            return;
        }
        const x = $event.clientX;
        const y = $event.clientY;
        const elem = this.copyID.nativeElement as HTMLDivElement;

        elem.style.top = y - 15 + 'px';
        elem.style.left = x + 20 + 'px';
        this.setTooltipVisibility(false);
    }

    copyToClipboard(conference: HearingSummary) {
        this.clipboardService.copyFromContent(conference.id);
        this.tooltip = 'Conference ID copied to clipboard';
        this.setTooltipVisibility(false);
    }

    onMouseOut(): void {
        this.setTooltipVisibility(true);
    }

    setTooltipVisibility(visible: boolean) {
        this.displayTooltip = visible;
    }
}
