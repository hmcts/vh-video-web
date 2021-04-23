import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from '../shared/page-url.constants';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    constructor(private router: Router) {}

    ngOnInit() {
        this.router.navigate([`/${pageUrls.Navigator}`]);
    }
}
