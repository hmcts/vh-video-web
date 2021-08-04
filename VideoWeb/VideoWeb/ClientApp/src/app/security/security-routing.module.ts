import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { pageUrls } from '../shared/page-url.constants';
import { AlreadyAuthenticatedGuard } from './guards/already-authenticated.guard';
import { EjudSignInComponent } from './idp-selection/ejud-sign-in.component';
import { IdpSelectionComponent } from './idp-selection/idp-selection.component';
import { VhSignInComponent } from './idp-selection/vh-sign-in.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { UnauthorisedComponent } from './unauthorised/unauthorised.component';

export const routes: Routes = [
    { path: `${pageUrls.Login}`, component: LoginComponent },
    { path: `${pageUrls.Logout}`, component: LogoutComponent },
    { path: `${pageUrls.EJudSignIn}`, component: EjudSignInComponent, canActivate: [AlreadyAuthenticatedGuard] },
    { path: `${pageUrls.VHSignIn}`, component: VhSignInComponent, canActivate: [AlreadyAuthenticatedGuard] },
    { path: `${pageUrls.IdpSelection}`, component: IdpSelectionComponent },
    { path: `${pageUrls.Unauthorised}`, component: UnauthorisedComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SecurityRoutingModule {}
