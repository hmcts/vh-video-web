import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { JudgeEventService } from 'src/app/services/judge-event.service';

@Component({
  selector: 'app-equipment-check',
  templateUrl: './equipment-check.component.html',
  styleUrls: ['./equipment-check.component.css']
})
export class EquipmentCheckComponent implements OnInit, OnDestroy {
  conferenceId: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private judgeEventService: JudgeEventService
  ) { }

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

  ngOnDestroy() {
    this.judgeEventService.clearSubcriptions();
  }
}
