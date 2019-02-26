import { Component } from '@angular/core';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css']
})
export class ContactUsComponent {
  contact = {
    phone: '0300 303 0655',
    email: 'admin@videohearings.hmcts.net'
  };
  constructor() {

  }

}
