import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { BackNavigationService } from './back-navigation.service';

@Component({
    selector: 'app-back-navigation',
    templateUrl: './back-navigation.component.html',
})
export class BackNavigationComponent implements OnInit {
    linkText$: Observable<string>;
    constructor(private backNavigationService: BackNavigationService) {}

    ngOnInit(): void {
        this.linkText$ = this.backNavigationService.linkText$;
    }

    navigate() {
        this.backNavigationService.navigate();
    }
}
