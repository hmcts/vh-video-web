import { Component, Input, OnInit } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';

@Component({
    selector: 'app-copy-telephone-id',
    templateUrl: './copy-telephone-id.component.html'
})
export class CopyTelephoneIdComponent implements OnInit {
    @Input() telephoneNumber: string;
    @Input() telephoneId: string;
    tooltip: string;
    propertyIdName = 'copy-telephone-id';

    constructor(private clipboardService: ClipboardService) {}

    ngOnInit(): void {
        this.propertyIdName = this.propertyIdName + '-' + this.telephoneId;
        this.resetText();
    }

    copyToClipboard() {
        const text = `${this.telephoneNumber} (ID: ${this.telephoneId})`;
        this.clipboardService.copyFromContent(text);
        this.tooltip = 'Details copied to clipboard';
    }

    resetText() {
        this.tooltip = 'Copy joining by phone details to clipboard';
    }
}
