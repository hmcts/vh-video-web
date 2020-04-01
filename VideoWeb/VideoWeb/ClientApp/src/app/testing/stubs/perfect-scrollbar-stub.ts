import { Component, Input  } from '@angular/core';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

@Component({ selector: 'perfect-scrollbar', template: '' })
export class PerfectScrollbarStubComponent {
  @Input() config: PerfectScrollbarConfigInterface;
}


