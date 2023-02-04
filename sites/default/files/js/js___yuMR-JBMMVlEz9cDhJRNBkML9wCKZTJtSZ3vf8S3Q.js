/**
 * @file
 * JavaScript behaviors for Telephone element.
 */

(function ($, Drupal, drupalSettings, once) {

  'use strict';

  // @see https://github.com/jackocnr/intl-tel-input#options
  Drupal.webform = Drupal.webform || {};
  Drupal.webform.intlTelInput = Drupal.webform.intlTelInput || {};
  Drupal.webform.intlTelInput.options = Drupal.webform.intlTelInput.options || {};

  /**
   * Initialize Telephone international element.
   * @see http://intl-tel-input.com/node_modules/intl-tel-input/examples/gen/is-valid-number.html
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformTelephoneInternational = {
    attach: function (context) {
      if (!$.fn.intlTelInput) {
        return;
      }

      $(once('webform-telephone-international', 'input.js-webform-telephone-international', context)).each(function () {
        var $telephone = $(this);

        // Add error message container.
        var $error = $('<strong class="error form-item--error-message">' + Drupal.t('Invalid phone number') + '</strong>').hide();
        $telephone.closest('.js-form-item').append($error);

        var options = {
          // The utilsScript is fetched when the page has finished.
          // @see \Drupal\webform\Plugin\WebformElement\Telephone::prepare
          // @see https://github.com/jackocnr/intl-tel-input
          utilsScript: drupalSettings.webform.intlTelInput.utilsScript,
          nationalMode: false
        };

        // Parse data attributes.
        if ($telephone.attr('data-webform-telephone-international-initial-country')) {
          options.initialCountry = $telephone.attr('data-webform-telephone-international-initial-country');
        }
        if ($telephone.attr('data-webform-telephone-international-preferred-countries')) {
          options.preferredCountries = JSON.parse($telephone.attr('data-webform-telephone-international-preferred-countries'));
        }

        options = $.extend(options, Drupal.webform.intlTelInput.options);
        $telephone.intlTelInput(options);

        var reset = function () {
          $telephone.removeClass('error');
          $error.hide();
        };

        var validate = function () {
          if ($.trim($telephone.val())) {
            if (!$telephone.intlTelInput('isValidNumber')) {
              $telephone.addClass('error');
              var placeholder = $telephone.attr('placeholder');
              var message;
              if (placeholder) {
                message = Drupal.t('The phone number is not valid. (e.g. @example)', {'@example': placeholder});
              }
              else {
                message = Drupal.t('The phone number is not valid.');
              }
              $error.html(message).show();
              return false;
            }
          }
          return true;
        };

        $telephone.on('blur', function () {
          reset();
          validate();
        });

        $telephone.on('keyup change', reset);

        // Check for a valid phone number on submit.
        var $form = $(this.form);
        $form.on('submit', function (event) {
          if (!validate()) {
            $telephone.focus();
            event.preventDefault();

            // On validation error make sure to clear submit the once behavior.
            // @see Drupal.behaviors.webformSubmitOnce
            // @see webform.form.submit_once.js
            if (Drupal.behaviors.webformSubmitOnce) {
              Drupal.behaviors.webformSubmitOnce.clear();
            }
          }
        });
      });
    }
  };

})(jQuery, Drupal, drupalSettings, once);
;
/**
 * @file
 * JavaScript behaviors for multiple element.
 */

(function ($, Drupal, once) {

  'use strict';

  /**
   * Move show weight to after the table.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformMultipleTableDrag = {
    attach: function (context, settings) {
      for (var base in settings.tableDrag) {
        if (settings.tableDrag.hasOwnProperty(base)) {
          $(once('webform-multiple-table-drag', '.js-form-type-webform-multiple #' + base, context)).each(function () {
            var $tableDrag = $(this);
            var $toggleWeight = $tableDrag.prev().prev('.tabledrag-toggle-weight-wrapper');
            if ($toggleWeight.length) {
              $toggleWeight.addClass('webform-multiple-tabledrag-toggle-weight');
              $tableDrag.after($toggleWeight);
            }
          });
        }
      }
    }
  };

  /**
   * Submit multiple add number input value when enter is pressed.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformMultipleAdd = {
    attach: function (context, settings) {
      $(once('webform-multiple-add', '.js-webform-multiple-add', context)).each(function () {
        var $submit = $(this).find('input[type="submit"], button');
        var $number = $(this).find('input[type="number"]');
        $number.keyup(function (event) {
          if (event.which === 13) {
            // Note: Mousedown is the default trigger for Ajax events.
            // @see Drupal.Ajax.
            $submit.trigger('mousedown');
          }
        });
      });
    }
  };

})(jQuery, Drupal, once);
;
/**
 * @file
 * JavaScript behaviors for terms of service.
 */

(function ($, Drupal, once) {

  'use strict';

  // @see http://api.jqueryui.com/dialog/
  Drupal.webform = Drupal.webform || {};
  Drupal.webform.termsOfServiceModal = Drupal.webform.termsOfServiceModal || {};
  Drupal.webform.termsOfServiceModal.options = Drupal.webform.termsOfServiceModal.options || {};

  /**
   * Initialize terms of service element.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformTermsOfService = {
    attach: function (context) {
      $(once('webform-terms-of-service', '.js-form-type-webform-terms-of-service', context)).each(function () {
        var $element = $(this);
        var $a = $element.find('label a');
        var $details = $element.find('.webform-terms-of-service-details');

        var type = $element.attr('data-webform-terms-of-service-type');

        // Initialize the modal.
        if (type === 'modal') {
          // Move details title to attribute.
          var $title = $element.find('.webform-terms-of-service-details--title');
          if ($title.length) {
            $details.attr('title', $title.text());
            $title.remove();
          }

          var options = $.extend({
            modal: true,
            autoOpen: false,
            minWidth: 600,
            maxWidth: 800
          }, Drupal.webform.termsOfServiceModal.options);
          $details.dialog(options);
        }

        // Add aria-* attributes.
        if (type !== 'modal') {
          $a.attr({
            'aria-expanded': false,
            'aria-controls': $details.attr('id')
          });
        }

        // Set event handlers.
        $a.on('click', openDetails)
          .on('keydown', function (event) {
            // Space or Return.
            if (event.which === 32 || event.which === 13) {
              openDetails(event);
            }
          });

        function openDetails(event) {
          if (type === 'modal') {
            $details.dialog('open');
          }
          else {
            var expanded = ($a.attr('aria-expanded') === 'true');

            // Toggle `aria-expanded` attributes on link.
            $a.attr('aria-expanded', !expanded);

            // Toggle details.
            $details[expanded ? 'slideUp' : 'slideDown']();
          }
          event.preventDefault();
        }
      });
    }
  };

})(jQuery, Drupal, once);
;
