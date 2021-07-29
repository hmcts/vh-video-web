import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { BackNavigationService } from '../back-navigation.service';

@Component({
    selector: 'app-has-back-navigation',
    template: '<p>has-back-navigation</p>'
})
export abstract class HasBackNavigationComponent implements OnInit, OnDestroy {
    abstract backLinkText = 'back-navigation.back';
    abstract backLinkPath = '';
    constructor(protected backNavigationService: BackNavigationService) {}
    ngAfterViewInit(): void {
        console.log('Faz - ngAfterViewInit');
        this.backNavigationService.setLink(this.backLinkText, this.backLinkPath);
    }

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
