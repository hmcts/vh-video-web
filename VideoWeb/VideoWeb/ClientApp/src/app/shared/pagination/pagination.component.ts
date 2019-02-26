import { Component, EventEmitter, Input, Output } from '@angular/core';

import { PaginationModel } from './pagination-model';

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.css']
})
export class PaginationComponent {

    @Input() pagination: PaginationModel = new PaginationModel(0, 1, 1, 5);

    @Output() moveToStart$ = new EventEmitter();
    @Output() moveToEnd$ = new EventEmitter();
    @Output() moveNext$ = new EventEmitter();
    @Output() movePrevious$ = new EventEmitter();

    moveToPreviousPage() {
        this.movePrevious$.emit();
    }

    moveToNextPage() {
        this.moveNext$.emit();
    }

    moveToFirstPage() {
        this.moveToStart$.emit();
    }

    moveToLastPage() {
        this.moveToEnd$.emit();
    }
}
