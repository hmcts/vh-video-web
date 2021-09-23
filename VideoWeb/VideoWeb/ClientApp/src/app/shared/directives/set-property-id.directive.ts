import { Directive, OnInit, ElementRef, Input, Renderer2 } from '@angular/core';
@Directive({
    selector: '[appSetPropertyId]'
})
export class SetIdDirective implements OnInit {
    @Input() name: string;
    constructor(private el: ElementRef, private renderer: Renderer2) {}

    ngOnInit(): void {
        if (this.name) {
            this.renderer.setProperty(this.el.nativeElement, 'id', this.name);
        }
    }
}
