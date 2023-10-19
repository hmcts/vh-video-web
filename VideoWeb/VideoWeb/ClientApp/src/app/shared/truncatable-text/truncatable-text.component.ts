import { Component, ElementRef, Input, ViewChild, OnInit } from '@angular/core';

@Component({
    selector: 'app-truncatable-text',
    templateUrl: './truncatable-text.component.html',
    styleUrls: ['./truncatable-text.component.scss']
})
export class TruncatableTextComponent implements OnInit {
    displayTooltip: boolean;
    displayText: string;
    originalText: string;

    @ViewChild('textField', { static: false }) textField: ElementRef<HTMLSpanElement>;

    @Input() set text(value: string) {
        this.originalText = value;
    }

    @Input() maxLimit = 95;
    @Input() hideShowMore = false;

    ngOnInit(): void {
        this.checkOverFlow();
    }

    hasOverflowed(): boolean {
        const longestWord = this.getLongestWord(this.originalText);
        return longestWord.length > this.maxLimit;
    }

    getLongestWord(str: string): string {
        const words = str.split(' ');
        return words.reduce((longest, current) => {
            return current.length > longest.length ? current : longest;
        }, '');
    }

    private checkOverFlow() {
        if (this.hasOverflowed()) {
            this.displayText = this.originalText.substring(0, this.maxLimit);
            this.displayTooltip = true;
        } else {
            this.displayText = this.originalText;
            this.displayTooltip = false;
        }
    }
}
