(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
'use strict';

/**
 * Leaflet SVG circle marker with detachable and draggable label and text
 *
 * @author Alexander Milevski <info@w8r.name>
 * @license MIT
 * @preserve
 */
module.exports = require('./src/marker');

},{"./src/marker":3}],2:[function(require,module,exports){
(function (global){
"use strict";

var L = typeof window !== "undefined" ? window['L'] : typeof global !== "undefined" ? global['L'] : null;

var Circle = L.CircleMarker.extend({

  options: {
    textStyle: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 300
    },
    shiftY: 7
  },

  /**
   * @class LabeledCircle
   * @constructor
   * @extends {L.CircleMarker}
   * @param  {String}   text
   * @param  {L.LatLng} latlng
   * @param  {Object=}  options
   */
  initialize: function initialize(text, latlng, options) {
    /**
     * @type {String}
     */
    this._text = text;

    /**
     * @type {SVGTextElement}
     */
    this._textElement = null;

    /**
     * @type {TextNode}
     */
    this._textNode = null;

    /**
     * @type {Object|Null}
     */
    this._textLayer = null;

    L.CircleMarker.prototype.initialize.call(this, latlng, options);
  },


  /**
   * @param {String} text
   * @return {LabeledCircle}
   */
  setText: function setText(text) {
    this._text = text;
    if (this._textNode) {
      this._textElement.removeChild(this._textNode);
    }
    this._textNode = document.createTextNode(this._text);
    this._textElement.appendChild(this._textNode);

    return this;
  },


  /**
   * @return {String}
   */
  getText: function getText() {
    return this._text;
  },


  /**
   * Also bring text to front
   * @override
   */
  bringToFront: function bringToFront() {
    L.CircleMarker.prototype.bringToFront.call(this);
    this._groupTextToPath();
  },


  /**
   * @override
   */
  bringToBack: function bringToBack() {
    L.CircleMarker.prototype.bringToBack.call(this);
    this._groupTextToPath();
  },


  /**
   * Put text in the right position in the dom
   */
  _groupTextToPath: function _groupTextToPath() {
    var path = this._path;
    var textElement = this._textElement;
    var next = path.nextSibling;
    var parent = path.parentNode;

    if (textElement && parent) {
      if (next && next !== textElement) {
        parent.insertBefore(textElement, next);
      } else {
        parent.appendChild(textElement);
      }
    }
  },


  /**
   * Position the text in container
   */
  _updatePath: function _updatePath() {
    L.CircleMarker.prototype._updatePath.call(this);
    this._updateTextPosition();
  },


  /**
   * @override
   */
  _transform: function _transform(matrix) {
    L.CircleMarker.prototype._transform.call(this, matrix);

    // wrap textElement with a fake layer for renderer
    // to be able to transform it
    this._textLayer = this._textLayer || { _path: this._textElement };
    if (matrix) {
      this._renderer.transformPath(this._textLayer, matrix);
    } else {
      this._renderer._resetTransformPath(this._textLayer);
      this._updateTextPosition();
      this._textLayer = null;
    }
  },


  /**
   * @param  {L.Map} map
   * @return {LabeledCircle}
   */
  onAdd: function onAdd(map) {
    L.CircleMarker.prototype.onAdd.call(this, map);
    this._initText();
    this._updateTextPosition();
    this.setStyle();
    return this;
  },


  /**
   * Create and insert text
   */
  _initText: function _initText() {
    this._textElement = L.SVG.create('text');
    this.setText(this._text);
    this._renderer._rootGroup.appendChild(this._textElement);
  },


  /**
   * Calculate position for text
   */
  _updateTextPosition: function _updateTextPosition() {
    var textElement = this._textElement;
    if (textElement) {
      var bbox = textElement.getBBox();
      var textPosition = this._point.subtract(L.point(bbox.width, -bbox.height + this.options.shiftY).divideBy(2));

      textElement.setAttribute('x', textPosition.x);
      textElement.setAttribute('y', textPosition.y);
      this._groupTextToPath();
    }
  },


  /**
   * Set text style
   */
  setStyle: function setStyle(style) {
    L.CircleMarker.prototype.setStyle.call(this, style);
    if (this._textElement) {
      var styles = this.options.textStyle;
      for (var prop in styles) {
        if (styles.hasOwnProperty(prop)) {
          var styleProp = prop;
          if (prop === 'color') {
            styleProp = 'stroke';
          }
          this._textElement.style[styleProp] = styles[prop];
        }
      }
    }
  },


  /**
   * Remove text
   */
  onRemove: function onRemove(map) {
    if (this._textElement) {
      if (this._textElement.parentNode) {
        this._textElement.parentNode.removeChild(this._textElement);
      }
      this._textElement = null;
      this._textNode = null;
      this._textLayer = null;
    }

    return L.CircleMarker.prototype.onRemove.call(this, map);
  }
});

module.exports = L.TextCircle = Circle;
L.textCircle = function (text, latlng, options) {
  return new Circle(text, latlng, options);
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
(function (global){
"use strict";

var L = typeof window !== "undefined" ? window['L'] : typeof global !== "undefined" ? global['L'] : null;
var Circle = require('./circle');

var CircleTextMarker = L.FeatureGroup.extend({

  options: {

    /**
     * @param  {CircleTextMarker} marker
     * @param  {Object}        feature
     * @return {String}
     */
    getLabelText: function getLabelText(marker, feature) {
      return feature.properties.text;
    },

    /**
     * @param  {CircleTextMarker} marker
     * @param  {Object}        feature
     * @param  {L.LatLng}      latlng
     * @return {L.LatLng}
     */
    getLabelPosition: function getLabelPosition(marker, feature, latlng) {
      return feature.properties.labelPosition ? L.latLng(feature.properties.labelPosition.slice().reverse()) : latlng;
    },

    labelPositionKey: 'labelPosition',

    markerOptions: {
      color: '#f00',
      fillOpacity: 0.75,
      radius: 15
    }
  },

  /**
   * @class CircleTextMarker
   * @constructor
   * @extends {L.FeatureGroup}
   *
   * @param  {L.LatLng} latlng
   * @param  {Object=}  feature
   * @param  {Object=}  options
   */
  initialize: function initialize(latlng, feature, options) {
    L.Util.setOptions(this, options);

    /**
     * @type {Object}
     */
    this.feature = feature || {
      type: 'Feature',
      properties: {},
      geometry: {
        'type': 'Point'
      }
    };

    /**
     * @type {L.LatLng}
     */
    this._latlng = latlng;

    /**
     * @type {CircleLabel}
     */
    this._marker = null;

    this._createLayers();
    L.LayerGroup.prototype.initialize.call(this, [this._marker]);
  },


  /**
   * @return {L.LatLng}
   */
  getLabelPosition: function getLabelPosition() {
    return this._marker.getLatLng();
  },


  /**
   * @return {L.LatLng}
   */
  getLatLng: function getLatLng() {
    return this._latlng;
  },


  /**
   * @param {String} text
   * @return {CircleTextMarker}
   */
  setText: function setText(text) {
    this._marker.setText(text);
    return this;
  },


  /**
   * Creates label
   */
  _createLayers: function _createLayers() {
    var opts = this.options;
    var pos = opts.getLabelPosition(this, this.feature, this._latlng);
    var text = opts.getLabelText(this, this.feature);

    this._marker = new Circle(text, pos, L.Util.extend({
      interactive: this.options.interactive
    }, CircleTextMarker.prototype.options.markerOptions, opts.markerOptions));
  }
});

L.TextCircleMarker = CircleTextMarker;
L.textCircleMarker = function (latlng, feature, options) {
  return new CircleTextMarker(latlng, feature, options);
};

module.exports = CircleTextMarker;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./circle":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9jaXJjbGUuanMiLCJzcmMvbWFya2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7Ozs7OztBQU9BLE9BQU8sT0FBUCxHQUFpQixRQUFRLGNBQVIsQ0FBakI7Ozs7OztBQ1BBLElBQU0sSUFBSyxPQUFPLE1BQVAsS0FBa0IsV0FBbEIsR0FBZ0MsT0FBTyxHQUFQLENBQWhDLEdBQThDLE9BQU8sTUFBUCxLQUFrQixXQUFsQixHQUFnQyxPQUFPLEdBQVAsQ0FBaEMsR0FBOEMsSUFBdkc7O0FBRUEsSUFBTSxTQUFTLEVBQUUsWUFBRixDQUFlLE1BQWYsQ0FBc0I7O0FBRW5DLFdBQVM7QUFDUCxlQUFXO0FBQ1QsYUFBTyxNQURFO0FBRVQsZ0JBQVUsRUFGRDtBQUdULGtCQUFZO0FBSEgsS0FESjtBQU1QLFlBQVE7QUFORCxHQUYwQjs7QUFZbkM7Ozs7Ozs7O0FBUUEsWUFwQm1DLHNCQW9CeEIsSUFwQndCLEVBb0JsQixNQXBCa0IsRUFvQlYsT0FwQlUsRUFvQkQ7QUFDaEM7OztBQUdBLFNBQUssS0FBTCxHQUFvQixJQUFwQjs7QUFFQTs7O0FBR0EsU0FBSyxZQUFMLEdBQW9CLElBQXBCOztBQUVBOzs7QUFHQSxTQUFLLFNBQUwsR0FBb0IsSUFBcEI7O0FBRUE7OztBQUdBLFNBQUssVUFBTCxHQUFvQixJQUFwQjs7QUFFQSxNQUFFLFlBQUYsQ0FBZSxTQUFmLENBQXlCLFVBQXpCLENBQW9DLElBQXBDLENBQXlDLElBQXpDLEVBQStDLE1BQS9DLEVBQXVELE9BQXZEO0FBQ0QsR0ExQ2tDOzs7QUE2Q25DOzs7O0FBSUEsU0FqRG1DLG1CQWlEM0IsSUFqRDJCLEVBaURyQjtBQUNaLFNBQUssS0FBTCxHQUFhLElBQWI7QUFDQSxRQUFJLEtBQUssU0FBVCxFQUFvQjtBQUNsQixXQUFLLFlBQUwsQ0FBa0IsV0FBbEIsQ0FBOEIsS0FBSyxTQUFu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Q0FBYTtBQURkLEtBQWQsRUFHRSxpQkFBaUIsU0FBakIsQ0FBMkIsT0FBM0IsQ0FBbUMsYUFIckMsRUFJRSxLQUFLLGFBSlAsQ0FEYSxDQUFmO0FBT0Q7QUFsSDRDLENBQXRCLENBQXpCOztBQXNIQSxFQUFFLGdCQUFGLEdBQXFCLGdCQUFyQjtBQUNBLEVBQUUsZ0JBQUYsR0FBcUIsVUFBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixPQUFsQixFQUE4QjtBQUNqRCxTQUFPLElBQUksZ0JBQUosQ0FBcUIsTUFBckIsRUFBNkIsT0FBN0IsRUFBc0MsT0FBdEMsQ0FBUDtBQUNELENBRkQ7O0FBSUEsT0FBTyxPQUFQLEdBQWlCLGdCQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9cmV0dXJuIGV9KSgpIiwiLyoqXG4gKiBMZWFmbGV0IFNWRyBjaXJjbGUgbWFya2VyIHdpdGggZGV0YWNoYWJsZSBhbmQgZHJhZ2dhYmxlIGxhYmVsIGFuZCB0ZXh0XG4gKlxuICogQGF1dGhvciBBbGV4YW5kZXIgTWlsZXZza2kgPGluZm9AdzhyLm5hbWU+XG4gKiBAbGljZW5zZSBNSVRcbiAqIEBwcmVzZXJ2ZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vc3JjL21hcmtlcicpO1xuIiwiY29uc3QgTCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydMJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydMJ10gOiBudWxsKTtcblxuY29uc3QgQ2lyY2xlID0gTC5DaXJjbGVNYXJrZXIuZXh0ZW5kKHtcblxuICBvcHRpb25zOiB7XG4gICAgdGV4dFN0eWxlOiB7XG4gICAgICBjb2xvcjogJyNmZmYnLFxuICAgICAgZm9udFNpemU6IDEyLFxuICAgICAgZm9udFdlaWdodDogMzAwXG4gICAgfSxcbiAgICBzaGlmdFk6IDcsXG4gIH0sXG5cblxuICAvKipcbiAgICogQGNsYXNzIExhYmVsZWRDaXJjbGVcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBleHRlbmRzIHtMLkNpcmNsZU1hcmtlcn1cbiAgICogQHBhcmFtICB7U3RyaW5nfSAgIHRleHRcbiAgICogQHBhcmFtICB7TC5MYXRMbmd9IGxhdGxuZ1xuICAgKiBAcGFyYW0gIHtPYmplY3Q9fSAgb3B0aW9uc1xuICAgKi9cbiAgaW5pdGlhbGl6ZSh0ZXh0LCBsYXRsbmcsIG9wdGlvbnMpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMuX3RleHQgICAgICAgID0gdGV4dDtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtTVkdUZXh0RWxlbWVudH1cbiAgICAgKi9cbiAgICB0aGlzLl90ZXh0RWxlbWVudCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7VGV4dE5vZGV9XG4gICAgICovXG4gICAgdGhpcy5fdGV4dE5vZGUgICAgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge09iamVjdHxOdWxsfVxuICAgICAqL1xuICAgIHRoaXMuX3RleHRMYXllciAgID0gbnVsbDtcblxuICAgIEwuQ2lyY2xlTWFya2VyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgbGF0bG5nLCBvcHRpb25zKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdGV4dFxuICAgKiBAcmV0dXJuIHtMYWJlbGVkQ2lyY2xlfVxuICAgKi9cbiAgc2V0VGV4dCh0ZXh0KSB7XG4gICAgdGhpcy5fdGV4dCA9IHRleHQ7XG4gICAgaWYgKHRoaXMuX3RleHROb2RlKSB7XG4gICAgICB0aGlzLl90ZXh0RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLl90ZXh0Tm9kZSk7XG4gICAgfVxuICAgIHRoaXMuX3RleHROb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5fdGV4dCk7XG4gICAgdGhpcy5fdGV4dEVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fdGV4dE5vZGUpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0VGV4dCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdGV4dDtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBBbHNvIGJyaW5nIHRleHQgdG8gZnJvbnRcbiAgICogQG92ZXJyaWRlXG4gICAqL1xuICBicmluZ1RvRnJvbnQoKSB7XG4gICAgTC5DaXJjbGVNYXJrZXIucHJvdG90eXBlLmJyaW5nVG9Gcm9udC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuX2dyb3VwVGV4dFRvUGF0aCgpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBvdmVycmlkZVxuICAgKi9cbiAgYnJpbmdUb0JhY2soKSB7XG4gICAgTC5DaXJjbGVNYXJrZXIucHJvdG90eXBlLmJyaW5nVG9CYWNrLmNhbGwodGhpcyk7XG4gICAgdGhpcy5fZ3JvdXBUZXh0VG9QYXRoKCk7XG4gIH0sXG5cblxuICAvKipcbiAgICogUHV0IHRleHQgaW4gdGhlIHJpZ2h0IHBvc2l0aW9uIGluIHRoZSBkb21cbiAgICovXG4gIF9ncm91cFRleHRUb1BhdGgoKSB7XG4gICAgY29uc3QgcGF0aCAgICAgICAgPSB0aGlzLl9wYXRoO1xuICAgIGNvbnN0IHRleHRFbGVtZW50ID0gdGhpcy5fdGV4dEVsZW1lbnQ7XG4gICAgY29uc3QgbmV4dCAgICAgICAgPSBwYXRoLm5leHRTaWJsaW5nO1xuICAgIGNvbnN0IHBhcmVudCAgICAgID0gcGF0aC5wYXJlbnROb2RlO1xuXG5cbiAgICBpZiAodGV4dEVsZW1lbnQgJiYgcGFyZW50KSB7XG4gICAgICBpZiAobmV4dCAmJiBuZXh0ICE9PSB0ZXh0RWxlbWVudCkge1xuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRleHRFbGVtZW50LCBuZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZCh0ZXh0RWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG5cbiAgLyoqXG4gICAqIFBvc2l0aW9uIHRoZSB0ZXh0IGluIGNvbnRhaW5lclxuICAgKi9cbiAgX3VwZGF0ZVBhdGgoKSB7XG4gICAgTC5DaXJjbGVNYXJrZXIucHJvdG90eXBlLl91cGRhdGVQYXRoLmNhbGwodGhpcyk7XG4gICAgdGhpcy5fdXBkYXRlVGV4dFBvc2l0aW9uKCk7XG4gIH0sXG5cblxuICAvKipcbiAgICogQG92ZXJyaWRlXG4gICAqL1xuICBfdHJhbnNmb3JtKG1hdHJpeCkge1xuICAgIEwuQ2lyY2xlTWFya2VyLnByb3RvdHlwZS5fdHJhbnNmb3JtLmNhbGwodGhpcywgbWF0cml4KTtcblxuICAgIC8vIHdyYXAgdGV4dEVsZW1lbnQgd2l0aCBhIGZha2UgbGF5ZXIgZm9yIHJlbmRlcmVyXG4gICAgLy8gdG8gYmUgYWJsZSB0byB0cmFuc2Zvcm0gaXRcbiAgICB0aGlzLl90ZXh0TGF5ZXIgPSB0aGlzLl90ZXh0TGF5ZXIgfHwgeyBfcGF0aDogdGhpcy5fdGV4dEVsZW1lbnQgfTtcbiAgICBpZiAobWF0cml4KSB7XG4gICAgICB0aGlzLl9yZW5kZXJlci50cmFuc2Zvcm1QYXRoKHRoaXMuX3RleHRMYXllciwgbWF0cml4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVuZGVyZXIuX3Jlc2V0VHJhbnNmb3JtUGF0aCh0aGlzLl90ZXh0TGF5ZXIpO1xuICAgICAgdGhpcy5fdXBkYXRlVGV4dFBvc2l0aW9uKCk7XG4gICAgICB0aGlzLl90ZXh0TGF5ZXIgPSBudWxsO1xuICAgIH1cbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtMLk1hcH0gbWFwXG4gICAqIEByZXR1cm4ge0xhYmVsZWRDaXJjbGV9XG4gICAqL1xuICBvbkFkZChtYXApIHtcbiAgICBMLkNpcmNsZU1hcmtlci5wcm90b3R5cGUub25BZGQuY2FsbCh0aGlzLCBtYXApO1xuICAgIHRoaXMuX2luaXRUZXh0KCk7XG4gICAgdGhpcy5fdXBkYXRlVGV4dFBvc2l0aW9uKCk7XG4gICAgdGhpcy5zZXRTdHlsZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbmQgaW5zZXJ0IHRleHRcbiAgICovXG4gIF9pbml0VGV4dCgpIHtcbiAgICB0aGlzLl90ZXh0RWxlbWVudCA9IEwuU1ZHLmNyZWF0ZSgndGV4dCcpO1xuICAgIHRoaXMuc2V0VGV4dCh0aGlzLl90ZXh0KTtcbiAgICB0aGlzLl9yZW5kZXJlci5fcm9vdEdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3RleHRFbGVtZW50KTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgcG9zaXRpb24gZm9yIHRleHRcbiAgICovXG4gIF91cGRhdGVUZXh0UG9zaXRpb24oKSB7XG4gICAgY29uc3QgdGV4dEVsZW1lbnQgPSB0aGlzLl90ZXh0RWxlbWVudDtcbiAgICBpZiAodGV4dEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGJib3ggPSB0ZXh0RWxlbWVudC5nZXRCQm94KCk7XG4gICAgICBjb25zdCB0ZXh0UG9zaXRpb24gPSB0aGlzLl9wb2ludC5zdWJ0cmFjdChcbiAgICAgICAgTC5wb2ludChiYm94LndpZHRoLCAtYmJveC5oZWlnaHQgKyB0aGlzLm9wdGlvbnMuc2hpZnRZKS5kaXZpZGVCeSgyKSk7XG5cbiAgICAgIHRleHRFbGVtZW50LnNldEF0dHJpYnV0ZSgneCcsIHRleHRQb3NpdGlvbi54KTtcbiAgICAgIHRleHRFbGVtZW50LnNldEF0dHJpYnV0ZSgneScsIHRleHRQb3NpdGlvbi55KTtcbiAgICAgIHRoaXMuX2dyb3VwVGV4dFRvUGF0aCgpO1xuICAgIH1cbiAgfSxcblxuXG4gIC8qKlxuICAgKiBTZXQgdGV4dCBzdHlsZVxuICAgKi9cbiAgc2V0U3R5bGUoc3R5bGUpIHtcbiAgICBMLkNpcmNsZU1hcmtlci5wcm90b3R5cGUuc2V0U3R5bGUuY2FsbCh0aGlzLCBzdHlsZSk7XG4gICAgaWYgKHRoaXMuX3RleHRFbGVtZW50KSB7XG4gICAgICBjb25zdCBzdHlsZXMgPSB0aGlzLm9wdGlvbnMudGV4dFN0eWxlO1xuICAgICAgZm9yIChsZXQgcHJvcCBpbiBzdHlsZXMpIHtcbiAgICAgICAgaWYgKHN0eWxlcy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgIGxldCBzdHlsZVByb3AgPSBwcm9wO1xuICAgICAgICAgIGlmIChwcm9wID09PSAnY29sb3InKSB7XG4gICAgICAgICAgICBzdHlsZVByb3AgPSAnc3Ryb2tlJztcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fdGV4dEVsZW1lbnQuc3R5bGVbc3R5bGVQcm9wXSA9IHN0eWxlc1twcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGV4dFxuICAgKi9cbiAgb25SZW1vdmUobWFwKSB7XG4gICAgaWYgKHRoaXMuX3RleHRFbGVtZW50KSB7XG4gICAgICBpZiAodGhpcy5fdGV4dEVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICB0aGlzLl90ZXh0RWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX3RleHRFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3RleHRFbGVtZW50ID0gbnVsbDtcbiAgICAgIHRoaXMuX3RleHROb2RlID0gbnVsbDtcbiAgICAgIHRoaXMuX3RleHRMYXllciA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIEwuQ2lyY2xlTWFya2VyLnByb3RvdHlwZS5vblJlbW92ZS5jYWxsKHRoaXMsIG1hcCk7XG4gIH1cblxufSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBMLlRleHRDaXJjbGUgPSBDaXJjbGU7XG5MLnRleHRDaXJjbGUgPSAodGV4dCwgbGF0bG5nLCBvcHRpb25zKSA9PiBuZXcgQ2lyY2xlKHRleHQsIGxhdGxuZywgb3B0aW9ucyk7XG4iLCJjb25zdCBMID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ0wnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ0wnXSA6IG51bGwpO1xuY29uc3QgQ2lyY2xlID0gcmVxdWlyZSgnLi9jaXJjbGUnKTtcblxuY29uc3QgQ2lyY2xlVGV4dE1hcmtlciA9IEwuRmVhdHVyZUdyb3VwLmV4dGVuZCh7XG5cbiAgb3B0aW9uczoge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtICB7Q2lyY2xlVGV4dE1hcmtlcn0gbWFya2VyXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgZmVhdHVyZVxuICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRMYWJlbFRleHQ6IChtYXJrZXIsIGZlYXR1cmUpID0+IGZlYXR1cmUucHJvcGVydGllcy50ZXh0LFxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtICB7Q2lyY2xlVGV4dE1hcmtlcn0gbWFya2VyXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgZmVhdHVyZVxuICAgICAqIEBwYXJhbSAge0wuTGF0TG5nfSAgICAgIGxhdGxuZ1xuICAgICAqIEByZXR1cm4ge0wuTGF0TG5nfVxuICAgICAqL1xuICAgIGdldExhYmVsUG9zaXRpb246IChtYXJrZXIsIGZlYXR1cmUsIGxhdGxuZykgPT4ge1xuICAgICAgcmV0dXJuIGZlYXR1cmUucHJvcGVydGllcy5sYWJlbFBvc2l0aW9uID9cbiAgICAgICAgTC5sYXRMbmcoZmVhdHVyZS5wcm9wZXJ0aWVzLmxhYmVsUG9zaXRpb24uc2xpY2UoKS5yZXZlcnNlKCkpIDpcbiAgICAgICAgbGF0bG5nO1xuICAgIH0sXG5cbiAgICBsYWJlbFBvc2l0aW9uS2V5OiAnbGFiZWxQb3NpdGlvbicsXG5cbiAgICBtYXJrZXJPcHRpb25zOiB7XG4gICAgICBjb2xvcjogJyNmMDAnLFxuICAgICAgZmlsbE9wYWNpdHk6IDAuNzUsXG4gICAgICByYWRpdXM6IDE1XG4gICAgfVxuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBjbGFzcyBDaXJjbGVUZXh0TWFya2VyXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAZXh0ZW5kcyB7TC5GZWF0dXJlR3JvdXB9XG4gICAqXG4gICAqIEBwYXJhbSAge0wuTGF0TG5nfSBsYXRsbmdcbiAgICogQHBhcmFtICB7T2JqZWN0PX0gIGZlYXR1cmVcbiAgICogQHBhcmFtICB7T2JqZWN0PX0gIG9wdGlvbnNcbiAgICovXG4gIGluaXRpYWxpemUobGF0bG5nLCBmZWF0dXJlLCBvcHRpb25zKSB7XG4gICAgTC5VdGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHRoaXMuZmVhdHVyZSA9IGZlYXR1cmUgfHwge1xuICAgICAgdHlwZTogJ0ZlYXR1cmUnLFxuICAgICAgcHJvcGVydGllczoge30sXG4gICAgICBnZW9tZXRyeToge1xuICAgICAgICAndHlwZSc6ICdQb2ludCdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0wuTGF0TG5nfVxuICAgICAqL1xuICAgIHRoaXMuX2xhdGxuZyA9IGxhdGxuZztcblxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0NpcmNsZUxhYmVsfVxuICAgICAqL1xuICAgIHRoaXMuX21hcmtlciA9IG51bGw7XG5cbiAgICB0aGlzLl9jcmVhdGVMYXllcnMoKTtcbiAgICBMLkxheWVyR3JvdXAucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLFxuICAgICAgW3RoaXMuX21hcmtlcl0pO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0wuTGF0TG5nfVxuICAgKi9cbiAgZ2V0TGFiZWxQb3NpdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fbWFya2VyLmdldExhdExuZygpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0wuTGF0TG5nfVxuICAgKi9cbiAgZ2V0TGF0TG5nKCkge1xuICAgIHJldHVybiB0aGlzLl9sYXRsbmc7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRleHRcbiAgICogQHJldHVybiB7Q2lyY2xlVGV4dE1hcmtlcn1cbiAgICovXG4gIHNldFRleHQodGV4dCkge1xuICAgIHRoaXMuX21hcmtlci5zZXRUZXh0KHRleHQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgbGFiZWxcbiAgICovXG4gIF9jcmVhdGVMYXllcnMoKSB7XG4gICAgY29uc3Qgb3B0cyA9IHRoaXMub3B0aW9ucztcbiAgICBjb25zdCBwb3MgID0gb3B0cy5nZXRMYWJlbFBvc2l0aW9uKHRoaXMsIHRoaXMuZmVhdHVyZSwgdGhpcy5fbGF0bG5nKTtcbiAgICBjb25zdCB0ZXh0ID0gb3B0cy5nZXRMYWJlbFRleHQodGhpcywgdGhpcy5mZWF0dXJlKTtcblxuICAgIHRoaXMuX21hcmtlciA9IG5ldyBDaXJjbGUodGV4dCwgcG9zLFxuICAgICAgTC5VdGlsLmV4dGVuZCh7XG4gICAgICAgIGludGVyYWN0aXZlOiB0aGlzLm9wdGlvbnMuaW50ZXJhY3RpdmVcbiAgICAgIH0sXG4gICAgICAgIENpcmNsZVRleHRNYXJrZXIucHJvdG90eXBlLm9wdGlvbnMubWFya2VyT3B0aW9ucyxcbiAgICAgICAgb3B0cy5tYXJrZXJPcHRpb25zKVxuICAgICk7XG4gIH0sXG5cbn0pO1xuXG5MLlRleHRDaXJjbGVNYXJrZXIgPSBDaXJjbGVUZXh0TWFya2VyO1xuTC50ZXh0Q2lyY2xlTWFya2VyID0gKGxhdGxuZywgZmVhdHVyZSwgb3B0aW9ucykgPT4ge1xuICByZXR1cm4gbmV3IENpcmNsZVRleHRNYXJrZXIobGF0bG5nLCBmZWF0dXJlLCBvcHRpb25zKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2lyY2xlVGV4dE1hcmtlcjtcbiJdfQ==
