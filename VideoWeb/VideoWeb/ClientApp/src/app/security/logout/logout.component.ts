import { OnInit, Component, Injectable } from '@angular/core';
import { AdalService } from 'adal-angular4';

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html'
})

@Injectable()
export class LogoutComponent implements OnInit {
    constructor(private adalSvc: AdalService) {
    }

    ngOnInit() {
        if (this.adalSvc.userInfo.authenticated) {
            this.adalSvc.logOut();
        }
    }
}
