export class ElementHelper {
    static removeAriaPlaceholderAttribute(inputElement: Element) {
        // Accessibility workaround to remove aria placeholder elements from ng-selects
        if (!inputElement) {
            return;
        }
        inputElement.removeAttribute('aria-placeholder');
    }
}
