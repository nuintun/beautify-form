/*!
 * selectbox
 * Date: 2015/6/12
 * https://github.com/nuintun/beauty-form
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/beauty-form/blob/master/LICENSE
 */

'use strict';

require('./css/selectbox.css');

var $ = require('jquery');
var util = require('./util');

var timer;
var reference = 0;
var actived = null;
var win = $(window);
var doc = $(document);

/**
 * compile
 * @param context
 * @param template
 * @returns {string}
 */
function compile(context, template){
  var args = [].slice.call(arguments, 2);
  var html = template.apply(context, args);

  if ($.type(html) === 'string') {
    return html;
  } else {
    throw new TypeError('Render function must return a string.');
  }
}

function SelectBox(element, options){
  options = $.extend({
    select: function (element, text){
      return '<div class="ui-beauty-select-title" title="' + text + '">'
        + text + '</div><i class="ui-beauty-select-icon"></i>';
    },
    dropdown: function (element, options){
      return '<dl class="ui-beauty-select-dropdown-items">' + options + '</dl>';
    },
    optgroup: function (element, label){
      return '<dt class="ui-beauty-select-optgroup">' + label + '</dt>';
    },
    option: function (element, option){
      return '<dd class="ui-beauty-select-option' + (option.className ? ' ' + option.className : '') + '" '
        + option.indexAttr + '="' + option.index + '" tabindex="-1">' + option.text + '</dd>';
    },
    optionIndexAttr: 'data-option',
    optionSelectedClass: 'ui-beauty-select-option-selected',
    optionDisabledClass: 'ui-beauty-select-option-disabled'
  }, options);

  $.each(['select', 'dropdown', 'optgroup', 'option'], function (index, prop){
    if ($.type(options[prop]) !== 'function') {
      throw new TypeError('Options.' + prop + ' must be a function.');
    }
  });

  var context = this;

  context.type = 'select';
  context.opened = false;
  context.destroyed = false;
  context.element = $(element);
  context.options = options;

  context.__init();
}

/**
 * get
 * @param element
 * @returns {*}
 */
SelectBox.get = function (element){
  element = $(element);

  return element.data('beauty-select');
};

SelectBox.prototype = {
  __init: function (){
    var context = this;
    var options = context.options;

    actived = context;

    if (!reference) {
      var type = this.type;
      var selector = 'select';

      doc.on('change.beauty-' + type, selector, function (){
        var select = SelectBox.get(this);

        if (select) {
          select.__renderTitlebox();
          select.opened && select.__refreshSelected();
        }
      });

      doc.on('focusin.beauty-' + type, selector, function (){
        var select = SelectBox.get(this);

        if (select) {
          actived = select;

          select.__refreshSelectbox();
        }
      });

      doc.on('focusout.beauty-' + type, selector, function (){
        var select = SelectBox.get(this);

        select && select.__refreshSelectbox();
      });

      doc.on('mousedown.beauty-' + type, function (e){
        var target = e.target;
        var selectbox = actived.selectbox[0];
        var dropdown = actived.dropdown[0];

        if (
          selectbox !== target
          && !$.contains(selectbox, target)
          && dropdown !== target
          && !$.contains(dropdown, target)) {
          actived.close();
        }
      });

      win.on('resize.beauty-' + type, function (){
        clearTimeout(timer);

        timer = setTimeout(function (){
          actived.opened && actived.__position();
        }, 0);
      });
    }

    context.__beauty();

    context.element.on('keypress.beauty-' + type, function (e){
      if (e.keyCode === 13) {
        e.preventDefault();

        if (context.opened) {
          context.close();
        } else {
          context.open();
        }
      }
    });

    context.selectbox.on('mousedown.beauty-' + type, function (e){
      e.preventDefault();

      var select = context.element;

      if (select[0].disabled) return;

      context.focus();

      if (context.opened) {
        var target = e.target;
        var dropdown = context.dropdown[0];

        if (dropdown !== target && !$.contains(dropdown, target)) {
          context.close();
        }
      } else {
        context.open();
      }
    });

    context.selectbox.on('click.beauty-' + type, '[' + options.optionIndexAttr + ']', function (e){
      e.preventDefault();

      var option = $(this);

      if (option.hasClass(options.optionDisabledClass)) return;

      context.select(option.attr(options.optionIndexAttr));
      context.close();
    });

    return context;
  },
  __Size: function (){
    var element = this.element;
    var selectbox = this.selectbox;
    var width = element.outerWidth() - selectbox.outerWidth() + selectbox.width();
    var height = element.outerHeight() - selectbox.outerHeight() + selectbox.height();

    selectbox.width(width);
    selectbox.height(height);
    selectbox.css('line-height', height + 'px');

    return this;
  },
  __position: function (){
    var context = this;

    if (!context.opened) return context;

    var selectbox = context.selectbox;
    var dropdown = context.dropdown;
    var size = {
      window: {
        height: win.height()
      },
      selectbox: {
        outerWidth: selectbox.outerWidth(),
        outerHeight: selectbox.outerHeight()
      },
      dropdown: {
        width: dropdown.width(),
        outerWidth: dropdown.outerWidth(),
        outerHeight: dropdown.outerHeight()
      }
    };
    var scrollTop = win.scrollTop();
    var offset = selectbox.offset();
    var position = offset.top - scrollTop;

    position = position > size.window.height - position - size.selectbox.outerHeight
      ? 'top'
      : 'bottom';

    dropdown.addClass('ui-beauty-select-dropdown-' + position);
    dropdown.removeClass('ui-beauty-select-dropdown-' + (position === 'top' ? 'bottom' : 'top'));

    dropdown.css({
      left: 0,
      top: position === 'bottom'
        ? size.selectbox.outerHeight
        : -size.dropdown.outerHeight,
      width: Math.max(
        size.selectbox.outerWidth - size.dropdown.outerWidth + size.dropdown.width,
        size.dropdown.width
      )
    });

    return context;
  },
  __renderTitlebox: function (){
    var context = this;
    var element = context.element[0];
    var selectbox = context.selectbox;
    var selected = $(element.options[element.selectedIndex]);

    context.titlebox.html(compile(
      context,
      context.options.select,
      selectbox,
      selected.html()
    ));

    return context;
  },
  __renderDropdown: function (){
    var index = 0;
    var dropdown = '';
    var context = this;
    var options = context.options;
    var selectedIndex = context.element[0].selectedIndex;

    function option(element){
      var selected = index === selectedIndex;
      var option = {
        index: index++,
        text: element.html(),
        indexAttr: options.optionIndexAttr,
        className: element[0].disabled
          ? options.optionDisabledClass
          : ( selected ? options.optionSelectedClass : '')
      };

      dropdown += compile(
        context,
        options.option,
        element,
        option
      );
    }

    function optgroup(element){
      dropdown += compile(
        context,
        options.optgroup,
        element,
        element.attr('label')
      );
    }

    context.element.children().each(function (){
      var element = $(this);

      switch (this.nodeName.toLowerCase()) {
        case 'option':
          option(element);
          break;
        case 'optgroup':
          optgroup(element);
          element.children().each(function (){
            option($(this));
          });
          break;
      }
    });

    context.dropdown.html(compile(
      context,
      options.dropdown,
      context.dropdown,
      dropdown
    ));

    return context;
  },
  __refreshSelectbox: function (){
    var context = this;
    var element = context.element[0];
    var selectbox = context.selectbox;
    var focused = util.activeElement();

    focused = context.opened
      || focused === element
      || focused === selectbox[0]
      || $.contains(selectbox[0], focused);

    selectbox
      .toggleClass('ui-beauty-select-disabled', element.disabled)
      .toggleClass('ui-beauty-select-focus', focused);

    return context;
  },
  __refreshSelected: function (){
    var context = this;
    var options = context.options;
    var dropdown = context.dropdown;
    var selectedClass = options.optionSelectedClass;
    var selectedIndex = context.element[0].selectedIndex;

    dropdown
      .find('.' + selectedClass)
      .removeClass(selectedClass);

    var selected = dropdown
      .find('[' + options.optionIndexAttr + '=' + selectedIndex + ']');

    selected.addClass(selectedClass);
    selected[0].scrollIntoView();

    return context;
  },
  __beauty: function (){
    var context = this;
    var element = context.element;

    if (!SelectBox.get(element)) {
      element.addClass('ui-beauty-select-hidden');

      var selectbox = $('<div tabindex="-1" class="ui-beauty-select"/>');

      context.titlebox = $('<div class="ui-beauty-select-titlebox"/>');
      context.dropdown = $('<div class="ui-beauty-select-dropdown"/>');

      selectbox
        .append(context.titlebox)
        .insertAfter(context.element);

      context.selectbox = selectbox;

      reference++;

      element.data('beauty-select', context);
    }

    return context.refresh();
  },
  focus: function (){
    this.element.trigger('focus');

    return this;
  },
  blur: function (){
    this.element.trigger('blur');

    return this;
  },
  enable: function (){
    this.element[0].disabled = false;

    return this.__refreshSelectbox();
  },
  disable: function (){
    this.element[0].disabled = true;

    return this.__refreshSelectbox();
  },
  refresh: function (){
    var context = this;

    context.__Size();
    context.__renderTitlebox();
    context.__renderDropdown();

    return context.__refreshSelectbox();
  },
  select: function (index){
    this.element[0].selectedIndex = index;

    return this.__renderTitlebox();
  },
  open: function (){
    var context = this;

    if (context.opened) return context;

    context.opened = true;

    context.selectbox.addClass('ui-beauty-select-opened');
    context.dropdown.appendTo(context.selectbox);
    context.__position();

    context.__refreshSelected();

    return context;
  },
  close: function (){
    var context = this;

    if (!context.opened) return context;

    context.opened = false;

    context.dropdown.detach();
    context.selectbox.removeClass('ui-beauty-select-opened');

    return context;
  },
  destroy: function (){
    var context = this;

    if (context.destroyed) return;

    var type = context.type;
    var element = context.element;

    context.selectbox.off();
    context.element.off('keypress.beauty-' + type);
    context.selectbox.remove();
    context.dropdown.remove();
    element.removeData('beauty-select');
    element.removeClass('ui-beauty-select-hidden');

    reference--;

    if (!reference) {
      doc.off('change.beauty-' + type);
      doc.off('focusin.beauty-' + type);
      doc.off('focusout.beauty-' + type);
      doc.off('mousedown.beauty-' + type);
      win.off('resize.beauty-' + type);
    }

    context.destroyed = true;
  }
};

$.fn.selectbox = function (){
  var elements = this;
  var method, options;
  var args = [].slice.call(arguments, 1);

  method = options = arguments[0];

  return elements.each(function (){
    var select = SelectBox.get(this);

    if (!select) {
      select = new SelectBox(this, options);
    }

    if ($.type(method) === 'string') {
      select[method] && select[method].apply(select, args);
    }
  });
};

module.exports = $;
