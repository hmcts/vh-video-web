import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-equipment-check',
  templateUrl: './equipment-check.component.html',
  styleUrls: ['./equipment-check.component.css']
})
export class EquipmentCheckComponent implements OnInit {
  conferenceId: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
  }

  goToCameraAndMicCheck() {
    this.router.navigate([PageUrls.CameraWorking, this.conferenceId]);
  }
}
