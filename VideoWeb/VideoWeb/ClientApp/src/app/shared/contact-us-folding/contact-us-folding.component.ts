import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contact-us-folding',
  templateUrl: './contact-us-folding.component.html',
  styleUrls: ['./contact-us-folding.component.css']
})
export class ContactUsFoldingComponent implements OnInit {

  contact = {
    phone: '0300 303 0655',
    email: 'admin@videohearings.hmcts.net'
  };

  constructor() { }

  ngOnInit() {
  }

}
