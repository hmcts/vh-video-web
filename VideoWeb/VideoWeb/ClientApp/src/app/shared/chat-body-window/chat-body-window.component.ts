import { Component, OnInit, Input } from '@angular/core';
import { InstantMessage } from 'src/app/services/models/instant-message';

@Component({
    selector: 'app-chat-body-window',
    templateUrl: './chat-body-window.component.html',
    styleUrls: ['./chat-body-window.component.scss', '../../vh-officer/vho-global-styles.scss']
})
export class ChatBodyWindowComponent implements OnInit {
    @Input() messages: InstantMessage[];

    constructor() {}

    ngOnInit() {}
}
