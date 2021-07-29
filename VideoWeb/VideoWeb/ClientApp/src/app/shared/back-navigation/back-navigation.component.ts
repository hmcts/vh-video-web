import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BackLinkDetails } from '../models/back-link-details';
import { Location } from '@angular/common';
import { filter, map } from 'rxjs/operators';

@Component({
    selector: 'app-back-navigation',
    templateUrl: './back-navigation.component.html'
})
export class BackNavigationComponent implements OnInit, OnDestroy {
    backLink$ = new BehaviorSubject<BackLinkDetails>(null);
    linkText$ = new BehaviorSubject<string>(null);
    linkPath$ = new BehaviorSubject<string>(null);
    routerEventSubscription: Subscription;

    constructor(private router: Router, private location: Location, private activatedRoute: ActivatedRoute) {}
    ngOnDestroy(): void {
        throw new Error('Faz - Method not implemented.');
    }

    ngOnInit(): void {
        this.routerEventSubscription = this.router.events
            .pipe(
                filter(event => event instanceof NavigationEnd),
                map(() => {
                    let child = this.activatedRoute.firstChild;
                    while (child.firstChild) {
                        child = child.firstChild;
                    }
                    if (child.snapshot.data['backLink']) {
                        return child.snapshot.data['backLink'];
                    }
                    return null;
                })
            )
            .subscribe({
                next: (backLink: BackLinkDetails) => {
                    this.linkText$.next(backLink?.text);
                    this.linkPath$.next(backLink?.path);
                }
            });
        // this.routerEventSubscription = this.router.events.subscribe(event => {
        //     console.log('Faz - Nav router events', event);
        //     if (event instanceof NavigationEnd) {
        //         console.log('Faz - root', this.router.routerState.root);
        //         console.log('Faz - data', this.router.routerState.root.data);
        //         const backLinkDetails: BackLinkDetails = this.router.routerState.root.data['backLink'];
        //         console.log('Faz - backLinkDetails', backLinkDetails);
        //         if (backLinkDetails) {
        //             console.log('Faz - backLinkDetails is something');
        //             this.linkText$.next(backLinkDetails.text);
        //             this.linkPath$.next(backLinkDetails.path);
        //         } else {
        //             console.log('Faz - backLinkDetails is nothing');
        //             this.linkText$.next(null);
        //             this.linkPath$.next(null);
        //         }
        //         console.log('Faz - linkText$', this.linkText$.value);
        //         console.log('Faz - linkText$', this.linkPath$.value);
        //     }
        // });
    }

    navigate() {
        const linkPath = this.linkPath$.value;
        if (!linkPath) {
            console.log('Faz - back');
            this.location.back();
        } else {
            console.log('Faz - go');
            this.router.navigate([linkPath]);
        }
    }
}
