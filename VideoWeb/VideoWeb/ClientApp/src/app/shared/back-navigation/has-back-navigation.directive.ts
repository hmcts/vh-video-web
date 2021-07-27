import { Directive, OnDestroy, OnInit } from '@angular/core';
import { BackNavigationService } from './back-navigation.service';

@Directive()
export abstract class HasBackNavigationDirective implements OnInit, OnDestroy {
    abstract backLinkText = 'back-navigation.back';
    abstract backLinkPath = '';
    constructor(protected backNavigationService: BackNavigationService) {}

    ngOnInit(): void {
        console.log('Faz - ngOnInit');
        console.log('Faz - HasBackNavigationDirective.backLinkText', this.backLinkText);
        console.log('Faz - HasBackNavigationDirective.backLinkPath', this.backLinkPath);

        this.backNavigationService.setLink(this.backLinkText, this.backLinkPath);
    }

    ngOnDestroy(): void {
        console.log('Faz - ngOnDestroy');
        this.backNavigationService.clear();
    }

    setLink() {}
}
