import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JudgeEventService } from 'src/app/services/judge-event.service';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-equipment-check',
    templateUrl: './equipment-check.component.html'
})
export class EquipmentCheckComponent implements OnInit {
    conferenceId: string;

    constructor(private router: Router, private route: ActivatedRoute, private judgeEventService: JudgeEventService) {}

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.judgeEventService.raiseJudgeUnavailableEvent();
    }

    goToCameraAndMicCheck() {
        if (this.conferenceId) {
            this.router.navigate([PageUrls.SwitchOnCameraMicrophone, this.conferenceId]);
        } else {
            this.router.navigate([PageUrls.SwitchOnCameraMicrophone]);
        }
    }
}
