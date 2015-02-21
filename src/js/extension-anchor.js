/*global mediumEditorUtil, console, meSelection,
  ButtonsData, DefaultButton */

var AnchorExtension;

(function (window, document) {
    'use strict';

    function AnchorDerived() {
        this.parent = true;
        this.options = {
            name: 'anchor',
            action: 'anchor',
            aria: 'link',
            tagNames: ['a'],
            contentDefault: '<b>#</b>',
            contentFA: '<i class="fa fa-link"></i>'
        };
        this.name = 'anchor';
    }

    AnchorDerived.prototype = {

        getForm: function () {
            if (!this.anchorForm) {
                this.anchorForm = this.createForm();
            }
            return this.anchorForm;
        },

        getInput: function () {
            return this.getForm().querySelector('input.medium-editor-toolbar-input');
        },

        deactivate: function () {
            if (!this.anchorForm) {
                return false;
            }

            if (this.anchorForm.parentNode) {
                this.anchorForm.parentNode.removeChild(this.anchorForm);
            }

            delete this.anchorForm;
        },

        doLinkCreation: function () {
            var button = null,
                target,
                targetCheckbox = this.getForm().querySelector('.medium-editor-toolbar-anchor-target'),
                buttonCheckbox = this.getForm().querySelector('.medium-editor-toolbar-anchor-button');

            if (targetCheckbox && targetCheckbox.checked) {
                target = "_blank";
            } else {
                target = "_self";
            }

            if (buttonCheckbox && buttonCheckbox.checked) {
                button = this.base.options.anchorButtonClass;
            }

            this.base.createLink(this.getInput(), target, button);
        },

        doFormCancel: function () {
            this.base.showToolbarActions();
            this.base.restoreSelection();
        },

        handleOutsideInteraction: function (event) {
            if (event.target !== this.getForm() &&
                    !mediumEditorUtil.isDescendant(this.getForm(), event.target) &&
                    !mediumEditorUtil.isDescendant(this.base.toolbarActions, event.target)) {
                this.base.keepToolbarAlive = false;
                this.base.checkSelection();
            }
        },

        executeAction: function () {
            if (!this.base.selection) {
                this.base.checkSelection();
            }

            var selectedParentElement = meSelection.getSelectedParentElement(this.base.selectionRange);
            if (selectedParentElement.tagName &&
                    selectedParentElement.tagName.toLowerCase() === 'a') {
                return this.base.options.ownerDocument.execCommand('unlink', false, null);
            }

            if (this.isDisplayed()) {
                this.base.showToolbarActions();
            } else {
                this.showForm();
            }

            return false;
        },

        createForm: function () {
            var doc = this.base.options.ownerDocument,
                form = doc.createElement('div'),
                input = doc.createElement('input'),
                close = doc.createElement('a'),
                save = doc.createElement('a'),
                target,
                target_label,
                button,
                button_label;

            // Anchor Form (div)
            form.className = 'medium-editor-toolbar-form';
            form.id = 'medium-editor-toolbar-form-anchor-' + this.base.id;

            // Handle clicks on the form itself
            this.base.on(form, 'click', function (event) {
                event.stopPropagation();
                this.base.keepToolbarAlive = true;
            }.bind(this));

            // Add url textbox
            input.setAttribute('type', 'text');
            input.className = 'medium-editor-toolbar-input';
            input.setAttribute('placeholder', this.base.options.anchorInputPlaceholder);
            form.appendChild(input);

            // Handle typing in the textbox
            this.base.on(input, 'keyup', function (event) {
                // For ENTER -> create the anchor
                if (event.keyCode === mediumEditorUtil.keyCode.ENTER) {
                    event.preventDefault();
                    this.doLinkCreation();
                    return;
                }

                // For ESCAPE -> close the form
                if (event.keyCode === mediumEditorUtil.keyCode.ESCAPE) {
                    event.preventDefault();
                    this.doFormCancel();
                }
            }.bind(this));

            // Handle clicks into the textbox
            this.base.on(input, 'click', function (event) {
                // make sure not to hide form when cliking into the input
                event.stopPropagation();
                this.base.keepToolbarAlive = true;
            }.bind(this));

            // Add save buton
            save.setAttribute('href', '#');
            save.className = 'medium-editor-toobar-save';
            save.innerHTML = this.base.options.buttonLabels === 'fontawesome' ?
                             '<i class="fa fa-check"></i>' :
                             '&#10003;';
            form.appendChild(save);

            // Handle save button clicks (capture)
            this.base.on(save, 'click', function (event) {
                // Clicking Save -> create the anchor
                event.preventDefault();
                this.doLinkCreation();
            }.bind(this), true);

            // Add close button
            close.setAttribute('href', '#');
            close.className = 'medium-editor-toobar-close';
            close.innerHTML = this.base.options.buttonLabels === 'fontawesome' ?
                              '<i class="fa fa-times"></i>' :
                              '&times;';
            form.appendChild(close);

            // Handle close button clicks
            this.base.on(close, 'click', function (event) {
                // Click Close -> close the form
                event.preventDefault();
                this.doFormCancel();
            }.bind(this));

            // (Optional) Add 'open in new window' checkbox
            if (this.base.options.anchorTarget) {
                target = doc.createElement('input');
                target.setAttribute('type', 'checkbox');
                target.className = 'medium-editor-toolbar-anchor-target';

                target_label = doc.createElement('label');
                target_label.innerHTML = this.base.options.anchorInputCheckboxLabel;
                target_label.insertBefore(target, target_label.firstChild);

                form.appendChild(target_label);
            }

            // (Optional) Add 'add button class to anchor' checkbox
            if (this.base.options.anchorButton) {
                button = doc.createElement('input');
                button.setAttribute('type', 'checkbox');
                button.className = 'medium-editor-toolbar-anchor-button';

                button_label = doc.createElement('label');
                button_label.innerHTML = "Button";
                button_label.insertBefore(button, button_label.firstChild);

                form.appendChild(button_label);
            }

            // Handle click (capture) & focus (capture) outside of the form
            this.base.on(doc.body, 'click', this.handleOutsideInteraction.bind(this), true);
            this.base.on(doc.body, 'focus', this.handleOutsideInteraction.bind(this), true);

            return form;
        },

        focus: function (value) {
            var input = this.getInput();
            input.focus();
            input.value = value || '';
        },

        hideForm: function () {
            this.getForm().style.display = 'none';
        },

        showForm: function (link_value) {
            this.base.saveSelection();
            this.base.hideToolbarDefaultActions();
            this.getForm().style.display = 'block';
            this.base.setToolbarPosition();
            this.base.keepToolbarAlive = true;
            this.focus(link_value);
        },

        isDisplayed: function () {
            return this.getForm().style.display === 'block';
        }
    };

    AnchorExtension = mediumEditorUtil.derives(DefaultButton, AnchorDerived);
}(window, document));
