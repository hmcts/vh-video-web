import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { pageUrls } from './shared/page-url.constants';
import { environment } from 'src/environments/environment';
import { AdminGuard } from './security/admin.guard';
import { AuthGuard } from './security/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: `${pageUrls.Home}`, pathMatch: 'full' },
    {
        canActivate: [AdminGuard],
        path: 'admin',
        loadChildren: () => import('./vh-officer/vh-officer.module').then(m => m.VhOfficerModule)
    },
    { path: `${pageUrls.Home}`, component: HomeComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: `${pageUrls.NotFound}`, pathMatch: 'full' }
];

@NgModule({
    exports: [RouterModule],
    imports: [RouterModule.forRoot(routes, { enableTracing: !environment.production })]
})
export class AppRoutingModule {}
