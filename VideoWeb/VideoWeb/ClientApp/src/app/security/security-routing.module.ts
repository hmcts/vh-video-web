import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { pageUrls } from '../shared/page-url.constants';
import { EjudSignInComponent } from './idp-selection/ejud-sign-in.component';
import { IdpSelectionComponent } from './idp-selection/idp-selection.component';
import { VhSignInComponent } from './idp-selection/vh-sign-in.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { UnauthorisedComponent } from './unauthorised/unauthorised.component';
import { Dom1SignInComponent } from './idp-selection/dom1-sign-in.component';
import { AlreadyAuthenticatedDom1Guard } from './guards/already-authenticated-dom1.guard';
import { AlreadyAuthenticatedEjudGuard } from './guards/already-authenticated-ejud.guard';
import { AlreadyAuthenticatedVhGuard } from './guards/already-authenticated-vh.guard';

export const routes: Routes = [
    { path: `${pageUrls.Login}`, component: LoginComponent },
    { path: `${pageUrls.Logout}`, component: LogoutComponent },
    { path: `${pageUrls.EJudSignIn}`, component: EjudSignInComponent, canActivate: [AlreadyAuthenticatedEjudGuard] },
    { path: `${pageUrls.Dom1SignIn}`, component: Dom1SignInComponent, canActivate: [AlreadyAuthenticatedDom1Guard] },
    { path: `${pageUrls.VHSignIn}`, component: VhSignInComponent, canActivate: [AlreadyAuthenticatedVhGuard] },
    { path: `${pageUrls.IdpSelection}`, component: IdpSelectionComponent },
    { path: `${pageUrls.Unauthorised}`, component: UnauthorisedComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SecurityRoutingModule {}
