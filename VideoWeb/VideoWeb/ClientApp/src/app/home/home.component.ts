import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {

  constructor(private router: Router) {
  }

  ngOnInit() {
    this.navigateToHearingList();
  }

  navigateToHearingList() {
    this.router.navigate(['participant/hearing-list']);
  }

}
