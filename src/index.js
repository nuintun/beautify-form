/*!
 * index
 * Date: 2017/08/29
 * https://github.com/nuintun/beauty-form
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/beauty-form/blob/master/LICENSE
 */

import './css/checkbox.css';
import './css/radiobox.css';
import './css/selectbox.css';

import Choice from './choice';
import SelectBox from './selectbox';

function create(Class) {
  return function(method, options) {
    var args = arguments;

    if (args.length > 1) {
      options = [].slice.call(args, 1);
    } else {
      options = method;
    }

    return this.each(function(index, element) {
      var instance = Class.get(element);

      if (!instance) {
        instance = new Class(element, options);
      } else if (instance[method]) {
        instance[method].apply(instance, options);
      }
    });
  };
}

$.fn.checkbox = create(Choice);
$.fn.radiobox = create(Choice);
$.fn.selectbox = create(SelectBox);