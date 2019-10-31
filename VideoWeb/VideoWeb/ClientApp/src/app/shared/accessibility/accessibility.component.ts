import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-accessibility',
  templateUrl: './accessibility.component.html',
  styleUrls: ['./accessibility.component.css']
})
export class AccessibilityComponent implements OnInit {

  isVisibleContents = true;
  isFooter = false;

  constructor() { }
  ngOnInit() {
  }
  goToDiv(fragment: string): void {
    window.document.getElementById(fragment).scrollIntoView();
  }

  scrollHandler(e) {
    this.isVisibleContents = e.makeVisible;
  }

  scrollFooter(e) {
    this.isFooter = !e.footer;
  }
}
