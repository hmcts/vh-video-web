import { Component, OnInit, Input, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';

/**
 * https://stackoverflow.com/a/53065618
 * modal setup based on answer
 */
@Component({
    selector: 'app-modal',
    template: '<ng-content></ng-content>'
})
export class ModalComponent implements OnInit, OnDestroy {
    @Input() id: string;
    private element: HTMLElement;

    constructor(private modalService: ModalService, private el: ElementRef) {
        this.element = this.el.nativeElement;
    }

    ngOnInit() {
        const modal = this;

        // ensure id attribute exists
        if (!this.id) {
            console.error('modal must have an id');
            return;
        }

        // move element to bottom of page (just before </body>) so it can be displayed above everything else
        document.body.appendChild(this.element);
        // close modal on background click
        this.element.addEventListener('click', function (e: any) {
            if (e.target.className === 'modal') {
                modal.close();
            }
        });

        // add self (this modal instance) to the modal service so it's accessible from controllers
        this.modalService.add(this);
    }

    // remove self from modal service when directive is destroyed
    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.modalService.remove(this.id);
        this.element.remove();
    }

    open(): void {
        this.element.classList.add('modal-open');
    }

    close(): void {
        this.element.classList.remove('modal-open');
    }
}
