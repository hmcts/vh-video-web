import { Component, OnInit } from '@angular/core';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-introduction',
  templateUrl: './introduction.component.html',
  styleUrls: ['./introduction.component.scss']
})
export class IntroductionComponent implements OnInit {
  conferenceId: string;

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
  }

  goToEquipmentCheck() {
    this.router.navigate([PageUrls.EquipmentCheck, this.conferenceId]);
  }
}
