// import { Injectable } from '@angular/core';
// import { HttpInterceptor } from '@angular/common/http';
// import { HttpRequest } from '@angular/common/http';
// import { HttpHandler } from '@angular/common/http';
// import { HttpEvent } from '@angular/common/http';
// import { HttpHeaders } from '@angular/common/http';
// import 'rxjs/add/observable/fromPromise';
// import { OidcSecurityService } from 'angular-auth-oidc-client';
// import { Observable } from 'rxjs';

// @Injectable()
// export class OidcHttpInterceptor implements HttpInterceptor {
//   constructor(private oidcSecurityService: OidcSecurityService) {}

//   intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//       const token = this.oidcSecurityService.getToken();
//       let changedRequest = request;
//       const headerSettings: {[name: string]: string | string[]; } = {};

//       for (const key of request.headers.keys()) {
//         headerSettings[key] = request.headers.getAll(key);
//       }
//       if (token) {
//         headerSettings['Authorization'] = 'Bearer ' + token;
//       }
//       headerSettings['Content-Type'] = 'application/json';
//       const newHeader = new HttpHeaders(headerSettings);

//       changedRequest = request.clone({
//         headers: newHeader});
//       return next.handle(changedRequest);
//   }
// }
