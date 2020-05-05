import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-audio-alert',
    templateUrl: './audio-alert.component.html',
    styleUrls: ['./audio-alert.component.scss']
})
export class AudioAlertComponent implements OnInit{
    @Output() alertClose: EventEmitter<boolean> = new EventEmitter<boolean>();

    ngOnInit() {
    }

    closeAlert() {
        this.alertClose.emit(true);
    }
}
