import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-camera-and-microphone',
    templateUrl: './camera-and-microphone.component.html'
})
export class CameraAndMicrophoneComponent implements OnInit {
    conferenceId: string;

    constructor(private router: Router, private route: ActivatedRoute) {}

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    }

    goToHearingRules() {
        this.router.navigate([pageUrls.HearingRules, this.conferenceId]);
    }
}
