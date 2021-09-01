import { Component, Input, OnInit } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';

@Component({
    selector: 'app-copy-quick-link',
    templateUrl: './copy-quick-link.component.html',
    styleUrls: ['./copy-quick-link.component.scss']
})
export class CopyQuickLinkComponent implements OnInit {
    hearingId: string;

    constructor(private clipBoardService: ClipboardService) {}

    ngOnInit(): void {}
}
