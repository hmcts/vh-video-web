import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TopMenuItems } from './topMenuItems';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  topMenuItems = [];

  @Input() loggedIn: boolean;

  constructor(private router: Router) {
  }

  selectMenuItem(indexOfItem: number) {
    for (const item of this.topMenuItems) {
      item.active = false;
    }
    this.topMenuItems[indexOfItem].active = true;
    this.router.navigate([this.topMenuItems[indexOfItem].url]);
  }

  ngOnInit() {
    this.topMenuItems = TopMenuItems;
  }
}
