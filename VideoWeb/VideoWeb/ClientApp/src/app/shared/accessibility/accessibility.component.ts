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
    console.log('Accessibility ->');
  }
  goToDiv(fragment: string): void {
    window.document.getElementById(fragment).scrollIntoView();
  }

  scrollHandler(e) {
    console.log('444444444');
    console.log(this.isVisibleContents);
    this.isVisibleContents = e.makeVisible;
  }

  scrollFooter(e) {
    console.log('242342343244');
    console.log(this.isFooter);
    this.isFooter = !e.footer;
  }
}
