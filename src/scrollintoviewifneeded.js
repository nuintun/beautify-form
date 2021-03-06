/**
 * @module scrollintoviewifneeded
 * @license MIT
 * @version 2016/07/15
 */

// Native
var native = document.documentElement.scrollIntoViewIfNeeded;

/**
 * @function scrollIntoViewIfNeeded
 * @param {HTMLElement} element
 * @param {boolean} centerIfNeeded
 */
export default function scrollIntoViewIfNeeded(element, centerIfNeeded) {
  if (!element) {
    throw new Error('Element is required in scrollIntoViewIfNeeded');
  }

  // Use native
  if (native) {
    return element.scrollIntoViewIfNeeded(centerIfNeeded);
  }

  function withinBounds(value, min, max, extent) {
    if (false === centerIfNeeded || (max <= value + extent && value <= min + extent)) {
      return Math.min(max, Math.max(min, value));
    } else {
      return (min + max) / 2;
    }
  }

  function makeArea(left, top, width, height) {
    return {
      left: left,
      top: top,
      width: width,
      height: height,
      right: left + width,
      bottom: top + height,
      translate: function(x, y) {
        return makeArea(x + left, y + top, width, height);
      },
      relativeFromTo: function(lhs, rhs) {
        var newLeft = left,
          newTop = top;

        lhs = lhs.offsetParent;
        rhs = rhs.offsetParent;

        if (lhs === rhs) {
          return area;
        }

        for (; lhs; lhs = lhs.offsetParent) {
          newLeft += lhs.offsetLeft + lhs.clientLeft;
          newTop += lhs.offsetTop + lhs.clientTop;
        }

        for (; rhs; rhs = rhs.offsetParent) {
          newLeft -= rhs.offsetLeft + rhs.clientLeft;
          newTop -= rhs.offsetTop + rhs.clientTop;
        }

        return makeArea(newLeft, newTop, width, height);
      }
    };
  }

  var parent;
  var area = makeArea(element.offsetLeft, element.offsetTop, element.offsetWidth, element.offsetHeight);

  while ((parent = element.parentNode) !== document) {
    var clientLeft = parent.offsetLeft + parent.clientLeft;
    var clientTop = parent.offsetTop + parent.clientTop;

    // Make area relative to parent's client area.
    area = area.relativeFromTo(element, parent).translate(-clientLeft, -clientTop);

    var scrollLeft = withinBounds(parent.scrollLeft, area.right - parent.clientWidth, area.left, parent.clientWidth);

    var scrollTop = withinBounds(parent.scrollTop, area.bottom - parent.clientHeight, area.top, parent.clientHeight);

    parent.scrollLeft = scrollLeft;
    parent.scrollTop = scrollTop;

    // Determine actual scroll amount by reading back scroll properties.
    area = area.translate(clientLeft - parent.scrollLeft, clientTop - parent.scrollTop);

    // Rewrite element
    element = parent;
  }
}
