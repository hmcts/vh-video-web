import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './security/auth.guard';
import { HomeComponent } from './home/home.component';
import { SendVideoEventsComponent } from './send-video-events/send-video-events.component';
import { pageUrls } from './shared/page-url.constants';
import { environment } from 'src/environments/environment';
import { AdminGuard } from './security/admin.guard';

export const routes: Routes = [
    { path: '', redirectTo: `${pageUrls.Home}`, pathMatch: 'full' },
    {
        canActivate: [AdminGuard],
        path: 'admin',
        loadChildren: () => import('./vh-officer/vh-officer.module').then((m) => m.VhOfficerModule)
    },
    { path: 'events/:conferenceId', component: SendVideoEventsComponent },
    { path: `${pageUrls.Home}`, component: HomeComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: `${pageUrls.NotFound}`, pathMatch: 'full', canActivate: [AuthGuard] }
];

@NgModule({
    exports: [RouterModule],
    imports: [RouterModule.forRoot(routes, { enableTracing: !environment.production })]
})
export class AppRoutingModule {}
