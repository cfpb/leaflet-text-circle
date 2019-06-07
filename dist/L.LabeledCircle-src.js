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

var LabeledMarker = L.FeatureGroup.extend({

  options: {

    /**
     * @param  {LabeledMarker} marker
     * @param  {Object}        feature
     * @return {String}
     */
    getLabelText: function getLabelText(marker, feature) {
      return feature.properties.text;
    },

    /**
     * @param  {LabeledMarker} marker
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
   * @class LabeledMarker
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
   * @return {LabeledMarker}
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
    }, LabeledMarker.prototype.options.markerOptions, opts.markerOptions));
  }
});

L.OptimizedCircleMarker = LabeledMarker;
L.optimizedCircleMarker = function (latlng, feature, options) {
  return new LabeledMarker(latlng, feature, options);
};

module.exports = LabeledMarker;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./circle":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9jaXJjbGUuanMiLCJzcmMvbWFya2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7Ozs7OztBQU9BLE9BQU8sT0FBUCxHQUFpQixRQUFRLGNBQVIsQ0FBakI7Ozs7OztBQ1BBLElBQU0sSUFBSyxPQUFPLE1BQVAsS0FBa0IsV0FBbEIsR0FBZ0MsT0FBTyxHQUFQLENBQWhDLEdBQThDLE9BQU8sTUFBUCxLQUFrQixXQUFsQixHQUFnQyxPQUFPLEdBQVAsQ0FBaEMsR0FBOEMsSUFBdkc7O0FBRUEsSUFBTSxTQUFTLEVBQUUsWUFBRixDQUFlLE1BQWYsQ0FBc0I7O0FBRW5DLFdBQVM7QUFDUCxlQUFXO0FBQ1QsYUFBTyxNQURFO0FBRVQsZ0JBQVUsRUFGRDtBQUdULGtCQUFZO0FBSEgsS0FESjtBQU1QLFlBQVE7QUFORCxHQUYwQjs7QUFZbkM7Ozs7Ozs7O0FBUUEsWUFwQm1DLHNCQW9CeEIsSUFwQndCLEVBb0JsQixNQXBCa0IsRUFvQlYsT0FwQlUsRUFvQkQ7QUFDaEM7OztBQUdBLFNBQUssS0FBTCxHQUFvQixJQUFwQjs7QUFFQTs7O0FBR0EsU0FBSyxZQUFMLEdBQW9CLElBQXBCOztBQUVBOzs7QUFHQSxTQUFLLFNBQUwsR0FBb0IsSUFBcEI7O0FBRUE7OztBQUdBLFNBQUssVUFBTCxHQUFvQixJQUFwQjs7QUFFQSxNQUFFLFlBQUYsQ0FBZSxTQUFmLENBQXlCLFVBQXpCLENBQW9DLElBQXBDLENBQXlDLElBQXpDLEVBQStDLE1BQS9DLEVBQXVELE9BQXZEO0FBQ0QsR0ExQ2tDOzs7QUE2Q25DOzs7O0FBSUEsU0FqRG1DLG1CQWlEM0IsSUFqRDJCLEVBaURyQjtBQUNaLFNBQUssS0FBTCxHQUFhLElBQWI7QUFDQSxRQUFJLEtBQUssU0FBVCxFQUFvQjtBQUNsQixXQUFLLFlBQUwsQ0FBa0IsV0FBbEIsQ0FBOEIsS0FBSyxTQUFu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QWE7QUFEZCxLQUFkLEVBR0UsY0FBYyxTQUFkLENBQXdCLE9BQXhCLENBQWdDLGFBSGxDLEVBSUUsS0FBSyxhQUpQLENBRGEsQ0FBZjtBQU9EO0FBbEh5QyxDQUF0QixDQUF0Qjs7QUFzSEEsRUFBRSxxQkFBRixHQUEwQixhQUExQjtBQUNBLEVBQUUscUJBQUYsR0FBMEIsVUFBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixPQUFsQixFQUE4QjtBQUN0RCxTQUFPLElBQUksYUFBSixDQUFrQixNQUFsQixFQUEwQixPQUExQixFQUFtQyxPQUFuQyxDQUFQO0FBQ0QsQ0FGRDs7QUFJQSxPQUFPLE9BQVAsR0FBaUIsYUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfXJldHVybiBlfSkoKSIsIi8qKlxuICogTGVhZmxldCBTVkcgY2lyY2xlIG1hcmtlciB3aXRoIGRldGFjaGFibGUgYW5kIGRyYWdnYWJsZSBsYWJlbCBhbmQgdGV4dFxuICpcbiAqIEBhdXRob3IgQWxleGFuZGVyIE1pbGV2c2tpIDxpbmZvQHc4ci5uYW1lPlxuICogQGxpY2Vuc2UgTUlUXG4gKiBAcHJlc2VydmVcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3NyYy9tYXJrZXInKTtcbiIsImNvbnN0IEwgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snTCddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnTCddIDogbnVsbCk7XG5cbmNvbnN0IENpcmNsZSA9IEwuQ2lyY2xlTWFya2VyLmV4dGVuZCh7XG5cbiAgb3B0aW9uczoge1xuICAgIHRleHRTdHlsZToge1xuICAgICAgY29sb3I6ICcjZmZmJyxcbiAgICAgIGZvbnRTaXplOiAxMixcbiAgICAgIGZvbnRXZWlnaHQ6IDMwMFxuICAgIH0sXG4gICAgc2hpZnRZOiA3LFxuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBjbGFzcyBMYWJlbGVkQ2lyY2xlXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAZXh0ZW5kcyB7TC5DaXJjbGVNYXJrZXJ9XG4gICAqIEBwYXJhbSAge1N0cmluZ30gICB0ZXh0XG4gICAqIEBwYXJhbSAge0wuTGF0TG5nfSBsYXRsbmdcbiAgICogQHBhcmFtICB7T2JqZWN0PX0gIG9wdGlvbnNcbiAgICovXG4gIGluaXRpYWxpemUodGV4dCwgbGF0bG5nLCBvcHRpb25zKSB7XG4gICAgLyoqXG4gICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLl90ZXh0ICAgICAgICA9IHRleHQ7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7U1ZHVGV4dEVsZW1lbnR9XG4gICAgICovXG4gICAgdGhpcy5fdGV4dEVsZW1lbnQgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge1RleHROb2RlfVxuICAgICAqL1xuICAgIHRoaXMuX3RleHROb2RlICAgID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtPYmplY3R8TnVsbH1cbiAgICAgKi9cbiAgICB0aGlzLl90ZXh0TGF5ZXIgICA9IG51bGw7XG5cbiAgICBMLkNpcmNsZU1hcmtlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIGxhdGxuZywgb3B0aW9ucyk7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9IHRleHRcbiAgICogQHJldHVybiB7TGFiZWxlZENpcmNsZX1cbiAgICovXG4gIHNldFRleHQodGV4dCkge1xuICAgIHRoaXMuX3RleHQgPSB0ZXh0O1xuICAgIGlmICh0aGlzLl90ZXh0Tm9kZSkge1xuICAgICAgdGhpcy5fdGV4dEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5fdGV4dE5vZGUpO1xuICAgIH1cbiAgICB0aGlzLl90ZXh0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRoaXMuX3RleHQpO1xuICAgIHRoaXMuX3RleHRFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX3RleHROb2RlKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG4gIGdldFRleHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RleHQ7XG4gIH0sXG5cblxuICAvKipcbiAgICogQWxzbyBicmluZyB0ZXh0IHRvIGZyb250XG4gICAqIEBvdmVycmlkZVxuICAgKi9cbiAgYnJpbmdUb0Zyb250KCkge1xuICAgIEwuQ2lyY2xlTWFya2VyLnByb3RvdHlwZS5icmluZ1RvRnJvbnQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLl9ncm91cFRleHRUb1BhdGgoKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAb3ZlcnJpZGVcbiAgICovXG4gIGJyaW5nVG9CYWNrKCkge1xuICAgIEwuQ2lyY2xlTWFya2VyLnByb3RvdHlwZS5icmluZ1RvQmFjay5jYWxsKHRoaXMpO1xuICAgIHRoaXMuX2dyb3VwVGV4dFRvUGF0aCgpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIFB1dCB0ZXh0IGluIHRoZSByaWdodCBwb3NpdGlvbiBpbiB0aGUgZG9tXG4gICAqL1xuICBfZ3JvdXBUZXh0VG9QYXRoKCkge1xuICAgIGNvbnN0IHBhdGggICAgICAgID0gdGhpcy5fcGF0aDtcbiAgICBjb25zdCB0ZXh0RWxlbWVudCA9IHRoaXMuX3RleHRFbGVtZW50O1xuICAgIGNvbnN0IG5leHQgICAgICAgID0gcGF0aC5uZXh0U2libGluZztcbiAgICBjb25zdCBwYXJlbnQgICAgICA9IHBhdGgucGFyZW50Tm9kZTtcblxuXG4gICAgaWYgKHRleHRFbGVtZW50ICYmIHBhcmVudCkge1xuICAgICAgaWYgKG5leHQgJiYgbmV4dCAhPT0gdGV4dEVsZW1lbnQpIHtcbiAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0ZXh0RWxlbWVudCwgbmV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodGV4dEVsZW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuXG4gIC8qKlxuICAgKiBQb3NpdGlvbiB0aGUgdGV4dCBpbiBjb250YWluZXJcbiAgICovXG4gIF91cGRhdGVQYXRoKCkge1xuICAgIEwuQ2lyY2xlTWFya2VyLnByb3RvdHlwZS5fdXBkYXRlUGF0aC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuX3VwZGF0ZVRleHRQb3NpdGlvbigpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBvdmVycmlkZVxuICAgKi9cbiAgX3RyYW5zZm9ybShtYXRyaXgpIHtcbiAgICBMLkNpcmNsZU1hcmtlci5wcm90b3R5cGUuX3RyYW5zZm9ybS5jYWxsKHRoaXMsIG1hdHJpeCk7XG5cbiAgICAvLyB3cmFwIHRleHRFbGVtZW50IHdpdGggYSBmYWtlIGxheWVyIGZvciByZW5kZXJlclxuICAgIC8vIHRvIGJlIGFibGUgdG8gdHJhbnNmb3JtIGl0XG4gICAgdGhpcy5fdGV4dExheWVyID0gdGhpcy5fdGV4dExheWVyIHx8IHsgX3BhdGg6IHRoaXMuX3RleHRFbGVtZW50IH07XG4gICAgaWYgKG1hdHJpeCkge1xuICAgICAgdGhpcy5fcmVuZGVyZXIudHJhbnNmb3JtUGF0aCh0aGlzLl90ZXh0TGF5ZXIsIG1hdHJpeCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlbmRlcmVyLl9yZXNldFRyYW5zZm9ybVBhdGgodGhpcy5fdGV4dExheWVyKTtcbiAgICAgIHRoaXMuX3VwZGF0ZVRleHRQb3NpdGlvbigpO1xuICAgICAgdGhpcy5fdGV4dExheWVyID0gbnVsbDtcbiAgICB9XG4gIH0sXG5cblxuICAvKipcbiAgICogQHBhcmFtICB7TC5NYXB9IG1hcFxuICAgKiBAcmV0dXJuIHtMYWJlbGVkQ2lyY2xlfVxuICAgKi9cbiAgb25BZGQobWFwKSB7XG4gICAgTC5DaXJjbGVNYXJrZXIucHJvdG90eXBlLm9uQWRkLmNhbGwodGhpcywgbWFwKTtcbiAgICB0aGlzLl9pbml0VGV4dCgpO1xuICAgIHRoaXMuX3VwZGF0ZVRleHRQb3NpdGlvbigpO1xuICAgIHRoaXMuc2V0U3R5bGUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW5kIGluc2VydCB0ZXh0XG4gICAqL1xuICBfaW5pdFRleHQoKSB7XG4gICAgdGhpcy5fdGV4dEVsZW1lbnQgPSBMLlNWRy5jcmVhdGUoJ3RleHQnKTtcbiAgICB0aGlzLnNldFRleHQodGhpcy5fdGV4dCk7XG4gICAgdGhpcy5fcmVuZGVyZXIuX3Jvb3RHcm91cC5hcHBlbmRDaGlsZCh0aGlzLl90ZXh0RWxlbWVudCk7XG4gIH0sXG5cblxuICAvKipcbiAgICogQ2FsY3VsYXRlIHBvc2l0aW9uIGZvciB0ZXh0XG4gICAqL1xuICBfdXBkYXRlVGV4dFBvc2l0aW9uKCkge1xuICAgIGNvbnN0IHRleHRFbGVtZW50ID0gdGhpcy5fdGV4dEVsZW1lbnQ7XG4gICAgaWYgKHRleHRFbGVtZW50KSB7XG4gICAgICBjb25zdCBiYm94ID0gdGV4dEVsZW1lbnQuZ2V0QkJveCgpO1xuICAgICAgY29uc3QgdGV4dFBvc2l0aW9uID0gdGhpcy5fcG9pbnQuc3VidHJhY3QoXG4gICAgICAgIEwucG9pbnQoYmJveC53aWR0aCwgLWJib3guaGVpZ2h0ICsgdGhpcy5vcHRpb25zLnNoaWZ0WSkuZGl2aWRlQnkoMikpO1xuXG4gICAgICB0ZXh0RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3gnLCB0ZXh0UG9zaXRpb24ueCk7XG4gICAgICB0ZXh0RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3knLCB0ZXh0UG9zaXRpb24ueSk7XG4gICAgICB0aGlzLl9ncm91cFRleHRUb1BhdGgoKTtcbiAgICB9XG4gIH0sXG5cblxuICAvKipcbiAgICogU2V0IHRleHQgc3R5bGVcbiAgICovXG4gIHNldFN0eWxlKHN0eWxlKSB7XG4gICAgTC5DaXJjbGVNYXJrZXIucHJvdG90eXBlLnNldFN0eWxlLmNhbGwodGhpcywgc3R5bGUpO1xuICAgIGlmICh0aGlzLl90ZXh0RWxlbWVudCkge1xuICAgICAgY29uc3Qgc3R5bGVzID0gdGhpcy5vcHRpb25zLnRleHRTdHlsZTtcbiAgICAgIGZvciAobGV0IHByb3AgaW4gc3R5bGVzKSB7XG4gICAgICAgIGlmIChzdHlsZXMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICBsZXQgc3R5bGVQcm9wID0gcHJvcDtcbiAgICAgICAgICBpZiAocHJvcCA9PT0gJ2NvbG9yJykge1xuICAgICAgICAgICAgc3R5bGVQcm9wID0gJ3N0cm9rZSc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX3RleHRFbGVtZW50LnN0eWxlW3N0eWxlUHJvcF0gPSBzdHlsZXNbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cblxuICAvKipcbiAgICogUmVtb3ZlIHRleHRcbiAgICovXG4gIG9uUmVtb3ZlKG1hcCkge1xuICAgIGlmICh0aGlzLl90ZXh0RWxlbWVudCkge1xuICAgICAgaWYgKHRoaXMuX3RleHRFbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgICAgdGhpcy5fdGV4dEVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl90ZXh0RWxlbWVudCk7XG4gICAgICB9XG4gICAgICB0aGlzLl90ZXh0RWxlbWVudCA9IG51bGw7XG4gICAgICB0aGlzLl90ZXh0Tm9kZSA9IG51bGw7XG4gICAgICB0aGlzLl90ZXh0TGF5ZXIgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBMLkNpcmNsZU1hcmtlci5wcm90b3R5cGUub25SZW1vdmUuY2FsbCh0aGlzLCBtYXApO1xuICB9XG5cbn0pO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gTC5UZXh0Q2lyY2xlID0gQ2lyY2xlO1xuTC50ZXh0Q2lyY2xlID0gKHRleHQsIGxhdGxuZywgb3B0aW9ucykgPT4gbmV3IENpcmNsZSh0ZXh0LCBsYXRsbmcsIG9wdGlvbnMpO1xuIiwiY29uc3QgTCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydMJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydMJ10gOiBudWxsKTtcbmNvbnN0IENpcmNsZSA9IHJlcXVpcmUoJy4vY2lyY2xlJyk7XG5cbmNvbnN0IExhYmVsZWRNYXJrZXIgPSBMLkZlYXR1cmVHcm91cC5leHRlbmQoe1xuXG4gIG9wdGlvbnM6IHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSAge0xhYmVsZWRNYXJrZXJ9IG1hcmtlclxuICAgICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgIGZlYXR1cmVcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICovXG4gICAgZ2V0TGFiZWxUZXh0OiAobWFya2VyLCBmZWF0dXJlKSA9PiBmZWF0dXJlLnByb3BlcnRpZXMudGV4dCxcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSAge0xhYmVsZWRNYXJrZXJ9IG1hcmtlclxuICAgICAqIEBwYXJhbSAge09iamVjdH0gICAgICAgIGZlYXR1cmVcbiAgICAgKiBAcGFyYW0gIHtMLkxhdExuZ30gICAgICBsYXRsbmdcbiAgICAgKiBAcmV0dXJuIHtMLkxhdExuZ31cbiAgICAgKi9cbiAgICBnZXRMYWJlbFBvc2l0aW9uOiAobWFya2VyLCBmZWF0dXJlLCBsYXRsbmcpID0+IHtcbiAgICAgIHJldHVybiBmZWF0dXJlLnByb3BlcnRpZXMubGFiZWxQb3NpdGlvbiA/XG4gICAgICAgIEwubGF0TG5nKGZlYXR1cmUucHJvcGVydGllcy5sYWJlbFBvc2l0aW9uLnNsaWNlKCkucmV2ZXJzZSgpKSA6XG4gICAgICAgIGxhdGxuZztcbiAgICB9LFxuXG4gICAgbGFiZWxQb3NpdGlvbktleTogJ2xhYmVsUG9zaXRpb24nLFxuXG4gICAgbWFya2VyT3B0aW9uczoge1xuICAgICAgY29sb3I6ICcjZjAwJyxcbiAgICAgIGZpbGxPcGFjaXR5OiAwLjc1LFxuICAgICAgcmFkaXVzOiAxNVxuICAgIH1cbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAY2xhc3MgTGFiZWxlZE1hcmtlclxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQGV4dGVuZHMge0wuRmVhdHVyZUdyb3VwfVxuICAgKlxuICAgKiBAcGFyYW0gIHtMLkxhdExuZ30gbGF0bG5nXG4gICAqIEBwYXJhbSAge09iamVjdD19ICBmZWF0dXJlXG4gICAqIEBwYXJhbSAge09iamVjdD19ICBvcHRpb25zXG4gICAqL1xuICBpbml0aWFsaXplKGxhdGxuZywgZmVhdHVyZSwgb3B0aW9ucykge1xuICAgIEwuVXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICB0aGlzLmZlYXR1cmUgPSBmZWF0dXJlIHx8IHtcbiAgICAgIHR5cGU6ICdGZWF0dXJlJyxcbiAgICAgIHByb3BlcnRpZXM6IHt9LFxuICAgICAgZ2VvbWV0cnk6IHtcbiAgICAgICAgJ3R5cGUnOiAnUG9pbnQnXG4gICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtMLkxhdExuZ31cbiAgICAgKi9cbiAgICB0aGlzLl9sYXRsbmcgPSBsYXRsbmc7XG5cblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtDaXJjbGVMYWJlbH1cbiAgICAgKi9cbiAgICB0aGlzLl9tYXJrZXIgPSBudWxsO1xuXG4gICAgdGhpcy5fY3JlYXRlTGF5ZXJzKCk7XG4gICAgTC5MYXllckdyb3VwLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcyxcbiAgICAgIFt0aGlzLl9tYXJrZXJdKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMLkxhdExuZ31cbiAgICovXG4gIGdldExhYmVsUG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX21hcmtlci5nZXRMYXRMbmcoKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMLkxhdExuZ31cbiAgICovXG4gIGdldExhdExuZygpIHtcbiAgICByZXR1cm4gdGhpcy5fbGF0bG5nO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0XG4gICAqIEByZXR1cm4ge0xhYmVsZWRNYXJrZXJ9XG4gICAqL1xuICBzZXRUZXh0KHRleHQpIHtcbiAgICB0aGlzLl9tYXJrZXIuc2V0VGV4dCh0ZXh0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGxhYmVsXG4gICAqL1xuICBfY3JlYXRlTGF5ZXJzKCkge1xuICAgIGNvbnN0IG9wdHMgPSB0aGlzLm9wdGlvbnM7XG4gICAgY29uc3QgcG9zICA9IG9wdHMuZ2V0TGFiZWxQb3NpdGlvbih0aGlzLCB0aGlzLmZlYXR1cmUsIHRoaXMuX2xhdGxuZyk7XG4gICAgY29uc3QgdGV4dCA9IG9wdHMuZ2V0TGFiZWxUZXh0KHRoaXMsIHRoaXMuZmVhdHVyZSk7XG5cbiAgICB0aGlzLl9tYXJrZXIgPSBuZXcgQ2lyY2xlKHRleHQsIHBvcyxcbiAgICAgIEwuVXRpbC5leHRlbmQoe1xuICAgICAgICBpbnRlcmFjdGl2ZTogdGhpcy5vcHRpb25zLmludGVyYWN0aXZlXG4gICAgICB9LFxuICAgICAgICBMYWJlbGVkTWFya2VyLnByb3RvdHlwZS5vcHRpb25zLm1hcmtlck9wdGlvbnMsXG4gICAgICAgIG9wdHMubWFya2VyT3B0aW9ucylcbiAgICApO1xuICB9LFxuXG59KTtcblxuTC5PcHRpbWl6ZWRDaXJjbGVNYXJrZXIgPSBMYWJlbGVkTWFya2VyO1xuTC5vcHRpbWl6ZWRDaXJjbGVNYXJrZXIgPSAobGF0bG5nLCBmZWF0dXJlLCBvcHRpb25zKSA9PiB7XG4gIHJldHVybiBuZXcgTGFiZWxlZE1hcmtlcihsYXRsbmcsIGZlYXR1cmUsIG9wdGlvbnMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMYWJlbGVkTWFya2VyO1xuIl19
