import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-waiting-room',
  templateUrl: './waiting-room.component.html'
})
export class WaitingRoomComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log('in waiting room after redirecting');
  }
}
