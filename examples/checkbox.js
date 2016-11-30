define("checkbox", ["./css/checkbox.css.js","jquery","./choice"], function(require, exports, module){
/*!
 * checkbox
 * Date: 2015/6/7
 * https://github.com/nuintun/beauty-form
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/beauty-form/blob/master/LICENSE
 */

'use strict';

require('./css/checkbox.css.js');

var $ = require('jquery');
var Choice = require('./choice');

$.fn.checkbox = function(method) {
  var elements = this;
  var args = [].slice.call(arguments, 1);

  return elements.each(function() {
    var choice = Choice.get(this);

    if (!choice) {
      choice = new Choice(this);

      // WAI-ARIA
      choice.choice.attr('role', 'checkbox');
    }

    if (method) {
      choice[method] && choice[method].apply(choice, args);
    }
  });
};

module.exports = $;

});
