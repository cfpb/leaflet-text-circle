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

    /**
     * @type {L.Point}
     */
    this._initialDistance = null;

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

/**
 * @param  {Object} feature
 * @param  {String=} key
 * @return {Object}
 */
function toGeometryCollection(feature, key) {
  key = key || 'labelPosition';
  var labelPos = feature.properties[key];

  if (!labelPos) throw new Error('No label position set');

  labelPos = labelPos.slice();
  var geometries = [{
    type: 'Point',
    coordinates: labelPos.slice()
  }, {
    type: 'Point',
    coordinates: labelPos.slice()
  }];

  return {
    type: 'Feature',
    properties: L.Util.extend({}, feature.properties, {
      geometriesTypes: ['connection', 'label', 'textbox']
    }),
    bbox: feature.bbox,
    geometry: {
      type: 'GeometryCollection',
      geometries: geometries
    }
  };
}

LabeledMarker.toGeometryCollection = toGeometryCollection;

L.LabeledCircleMarker = LabeledMarker;
L.labeledCircleMarker = function (latlng, feature, options) {
  return new LabeledMarker(latlng, feature, options);
};

module.exports = LabeledMarker;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./circle":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInNyYy9jaXJjbGUuanMiLCJzcmMvbWFya2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7Ozs7OztBQU9BLE9BQU8sT0FBUCxHQUFpQixRQUFRLGNBQVIsQ0FBakI7Ozs7OztBQ1BBLElBQU0sSUFBSyxPQUFPLE1BQVAsS0FBa0IsV0FBbEIsR0FBZ0MsT0FBTyxHQUFQLENBQWhDLEdBQThDLE9BQU8sTUFBUCxLQUFrQixXQUFsQixHQUFnQyxPQUFPLEdBQVAsQ0FBaEMsR0FBOEMsSUFBdkc7O0FBRUEsSUFBTSxTQUFTLEVBQUUsWUFBRixDQUFlLE1BQWYsQ0FBc0I7O0FBRW5DLFdBQVM7QUFDUCxlQUFXO0FBQ1QsYUFBTyxNQURFO0FBRVQsZ0JBQVUsRUFGRDtBQUdULGtCQUFZO0FBSEgsS0FESjtBQU1QLFlBQVE7QUFORCxHQUYwQjs7QUFZbkM7Ozs7Ozs7O0FBUUEsWUFwQm1DLHNCQW9CeEIsSUFwQndCLEVBb0JsQixNQXBCa0IsRUFvQlYsT0FwQlUsRUFvQkQ7QUFDaEM7OztBQUdBLFNBQUssS0FBTCxHQUFvQixJQUFwQjs7QUFFQTs7O0FBR0EsU0FBSyxZQUFMLEdBQW9CLElBQXBCOztBQUVBOzs7QUFHQSxTQUFLLFNBQUwsR0FBb0IsSUFBcEI7O0FBRUE7OztBQUdBLFNBQUssVUFBTCxHQUFvQixJQUFwQjs7QUFFQSxNQUFFLFlBQUYsQ0FBZSxTQUFmLENBQXlCLFVBQXpCLENBQW9DLElBQXBDLENBQXlDLElBQXpDLEVBQStDLE1BQS9DLEVBQXVELE9BQXZEO0FBQ0QsR0ExQ2tDOzs7QUE2Q25DOzs7O0FBSUEsU0FqRG1DLG1CQWlEM0IsSUFqRDJCLEVBaURyQjtBQUNaLFNBQUssS0FBTCxHQUFhLElBQWI7QUFDQSxRQUFJLEtBQUssU0FBVCxFQUFvQjtBQUNsQixXQUFLLFlBQUwsQ0FBa0IsV0FBbEIsQ0FBOEIsS0FBSyxTQUFu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UCxHQUFpQixhQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9cmV0dXJuIGV9KSgpIiwiLyoqXG4gKiBMZWFmbGV0IFNWRyBjaXJjbGUgbWFya2VyIHdpdGggZGV0YWNoYWJsZSBhbmQgZHJhZ2dhYmxlIGxhYmVsIGFuZCB0ZXh0XG4gKlxuICogQGF1dGhvciBBbGV4YW5kZXIgTWlsZXZza2kgPGluZm9AdzhyLm5hbWU+XG4gKiBAbGljZW5zZSBNSVRcbiAqIEBwcmVzZXJ2ZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vc3JjL21hcmtlcicpO1xuIiwiY29uc3QgTCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydMJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydMJ10gOiBudWxsKTtcblxuY29uc3QgQ2lyY2xlID0gTC5DaXJjbGVNYXJrZXIuZXh0ZW5kKHtcblxuICBvcHRpb25zOiB7XG4gICAgdGV4dFN0eWxlOiB7XG4gICAgICBjb2xvcjogJyNmZmYnLFxuICAgICAgZm9udFNpemU6IDEyLFxuICAgICAgZm9udFdlaWdodDogMzAwXG4gICAgfSxcbiAgICBzaGlmdFk6IDcsXG4gIH0sXG5cblxuICAvKipcbiAgICogQGNsYXNzIExhYmVsZWRDaXJjbGVcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBleHRlbmRzIHtMLkNpcmNsZU1hcmtlcn1cbiAgICogQHBhcmFtICB7U3RyaW5nfSAgIHRleHRcbiAgICogQHBhcmFtICB7TC5MYXRMbmd9IGxhdGxuZ1xuICAgKiBAcGFyYW0gIHtPYmplY3Q9fSAgb3B0aW9uc1xuICAgKi9cbiAgaW5pdGlhbGl6ZSh0ZXh0LCBsYXRsbmcsIG9wdGlvbnMpIHtcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMuX3RleHQgICAgICAgID0gdGV4dDtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtTVkdUZXh0RWxlbWVudH1cbiAgICAgKi9cbiAgICB0aGlzLl90ZXh0RWxlbWVudCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7VGV4dE5vZGV9XG4gICAgICovXG4gICAgdGhpcy5fdGV4dE5vZGUgICAgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge09iamVjdHxOdWxsfVxuICAgICAqL1xuICAgIHRoaXMuX3RleHRMYXllciAgID0gbnVsbDtcblxuICAgIEwuQ2lyY2xlTWFya2VyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgbGF0bG5nLCBvcHRpb25zKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdGV4dFxuICAgKiBAcmV0dXJuIHtMYWJlbGVkQ2lyY2xlfVxuICAgKi9cbiAgc2V0VGV4dCh0ZXh0KSB7XG4gICAgdGhpcy5fdGV4dCA9IHRleHQ7XG4gICAgaWYgKHRoaXMuX3RleHROb2RlKSB7XG4gICAgICB0aGlzLl90ZXh0RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLl90ZXh0Tm9kZSk7XG4gICAgfVxuICAgIHRoaXMuX3RleHROb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGhpcy5fdGV4dCk7XG4gICAgdGhpcy5fdGV4dEVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fdGV4dE5vZGUpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0VGV4dCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdGV4dDtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBBbHNvIGJyaW5nIHRleHQgdG8gZnJvbnRcbiAgICogQG92ZXJyaWRlXG4gICAqL1xuICBicmluZ1RvRnJvbnQoKSB7XG4gICAgTC5DaXJjbGVNYXJrZXIucHJvdG90eXBlLmJyaW5nVG9Gcm9udC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuX2dyb3VwVGV4dFRvUGF0aCgpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBvdmVycmlkZVxuICAgKi9cbiAgYnJpbmdUb0JhY2soKSB7XG4gICAgTC5DaXJjbGVNYXJrZXIucHJvdG90eXBlLmJyaW5nVG9CYWNrLmNhbGwodGhpcyk7XG4gICAgdGhpcy5fZ3JvdXBUZXh0VG9QYXRoKCk7XG4gIH0sXG5cblxuICAvKipcbiAgICogUHV0IHRleHQgaW4gdGhlIHJpZ2h0IHBvc2l0aW9uIGluIHRoZSBkb21cbiAgICovXG4gIF9ncm91cFRleHRUb1BhdGgoKSB7XG4gICAgY29uc3QgcGF0aCAgICAgICAgPSB0aGlzLl9wYXRoO1xuICAgIGNvbnN0IHRleHRFbGVtZW50ID0gdGhpcy5fdGV4dEVsZW1lbnQ7XG4gICAgY29uc3QgbmV4dCAgICAgICAgPSBwYXRoLm5leHRTaWJsaW5nO1xuICAgIGNvbnN0IHBhcmVudCAgICAgID0gcGF0aC5wYXJlbnROb2RlO1xuXG5cbiAgICBpZiAodGV4dEVsZW1lbnQgJiYgcGFyZW50KSB7XG4gICAgICBpZiAobmV4dCAmJiBuZXh0ICE9PSB0ZXh0RWxlbWVudCkge1xuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRleHRFbGVtZW50LCBuZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZCh0ZXh0RWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG5cbiAgLyoqXG4gICAqIFBvc2l0aW9uIHRoZSB0ZXh0IGluIGNvbnRhaW5lclxuICAgKi9cbiAgX3VwZGF0ZVBhdGgoKSB7XG4gICAgTC5DaXJjbGVNYXJrZXIucHJvdG90eXBlLl91cGRhdGVQYXRoLmNhbGwodGhpcyk7XG4gICAgdGhpcy5fdXBkYXRlVGV4dFBvc2l0aW9uKCk7XG4gIH0sXG5cblxuICAvKipcbiAgICogQG92ZXJyaWRlXG4gICAqL1xuICBfdHJhbnNmb3JtKG1hdHJpeCkge1xuICAgIEwuQ2lyY2xlTWFya2VyLnByb3RvdHlwZS5fdHJhbnNmb3JtLmNhbGwodGhpcywgbWF0cml4KTtcblxuICAgIC8vIHdyYXAgdGV4dEVsZW1lbnQgd2l0aCBhIGZha2UgbGF5ZXIgZm9yIHJlbmRlcmVyXG4gICAgLy8gdG8gYmUgYWJsZSB0byB0cmFuc2Zvcm0gaXRcbiAgICB0aGlzLl90ZXh0TGF5ZXIgPSB0aGlzLl90ZXh0TGF5ZXIgfHwgeyBfcGF0aDogdGhpcy5fdGV4dEVsZW1lbnQgfTtcbiAgICBpZiAobWF0cml4KSB7XG4gICAgICB0aGlzLl9yZW5kZXJlci50cmFuc2Zvcm1QYXRoKHRoaXMuX3RleHRMYXllciwgbWF0cml4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVuZGVyZXIuX3Jlc2V0VHJhbnNmb3JtUGF0aCh0aGlzLl90ZXh0TGF5ZXIpO1xuICAgICAgdGhpcy5fdXBkYXRlVGV4dFBvc2l0aW9uKCk7XG4gICAgICB0aGlzLl90ZXh0TGF5ZXIgPSBudWxsO1xuICAgIH1cbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtMLk1hcH0gbWFwXG4gICAqIEByZXR1cm4ge0xhYmVsZWRDaXJjbGV9XG4gICAqL1xuICBvbkFkZChtYXApIHtcbiAgICBMLkNpcmNsZU1hcmtlci5wcm90b3R5cGUub25BZGQuY2FsbCh0aGlzLCBtYXApO1xuICAgIHRoaXMuX2luaXRUZXh0KCk7XG4gICAgdGhpcy5fdXBkYXRlVGV4dFBvc2l0aW9uKCk7XG4gICAgdGhpcy5zZXRTdHlsZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbmQgaW5zZXJ0IHRleHRcbiAgICovXG4gIF9pbml0VGV4dCgpIHtcbiAgICB0aGlzLl90ZXh0RWxlbWVudCA9IEwuU1ZHLmNyZWF0ZSgndGV4dCcpO1xuICAgIHRoaXMuc2V0VGV4dCh0aGlzLl90ZXh0KTtcbiAgICB0aGlzLl9yZW5kZXJlci5fcm9vdEdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3RleHRFbGVtZW50KTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgcG9zaXRpb24gZm9yIHRleHRcbiAgICovXG4gIF91cGRhdGVUZXh0UG9zaXRpb24oKSB7XG4gICAgY29uc3QgdGV4dEVsZW1lbnQgPSB0aGlzLl90ZXh0RWxlbWVudDtcbiAgICBpZiAodGV4dEVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGJib3ggPSB0ZXh0RWxlbWVudC5nZXRCQm94KCk7XG4gICAgICBjb25zdCB0ZXh0UG9zaXRpb24gPSB0aGlzLl9wb2ludC5zdWJ0cmFjdChcbiAgICAgICAgTC5wb2ludChiYm94LndpZHRoLCAtYmJveC5oZWlnaHQgKyB0aGlzLm9wdGlvbnMuc2hpZnRZKS5kaXZpZGVCeSgyKSk7XG5cbiAgICAgIHRleHRFbGVtZW50LnNldEF0dHJpYnV0ZSgneCcsIHRleHRQb3NpdGlvbi54KTtcbiAgICAgIHRleHRFbGVtZW50LnNldEF0dHJpYnV0ZSgneScsIHRleHRQb3NpdGlvbi55KTtcbiAgICAgIHRoaXMuX2dyb3VwVGV4dFRvUGF0aCgpO1xuICAgIH1cbiAgfSxcblxuXG4gIC8qKlxuICAgKiBTZXQgdGV4dCBzdHlsZVxuICAgKi9cbiAgc2V0U3R5bGUoc3R5bGUpIHtcbiAgICBMLkNpcmNsZU1hcmtlci5wcm90b3R5cGUuc2V0U3R5bGUuY2FsbCh0aGlzLCBzdHlsZSk7XG4gICAgaWYgKHRoaXMuX3RleHRFbGVtZW50KSB7XG4gICAgICBjb25zdCBzdHlsZXMgPSB0aGlzLm9wdGlvbnMudGV4dFN0eWxlO1xuICAgICAgZm9yIChsZXQgcHJvcCBpbiBzdHlsZXMpIHtcbiAgICAgICAgaWYgKHN0eWxlcy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgIGxldCBzdHlsZVByb3AgPSBwcm9wO1xuICAgICAgICAgIGlmIChwcm9wID09PSAnY29sb3InKSB7XG4gICAgICAgICAgICBzdHlsZVByb3AgPSAnc3Ryb2tlJztcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fdGV4dEVsZW1lbnQuc3R5bGVbc3R5bGVQcm9wXSA9IHN0eWxlc1twcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGV4dFxuICAgKi9cbiAgb25SZW1vdmUobWFwKSB7XG4gICAgaWYgKHRoaXMuX3RleHRFbGVtZW50KSB7XG4gICAgICBpZiAodGhpcy5fdGV4dEVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICB0aGlzLl90ZXh0RWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX3RleHRFbGVtZW50KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3RleHRFbGVtZW50ID0gbnVsbDtcbiAgICAgIHRoaXMuX3RleHROb2RlID0gbnVsbDtcbiAgICAgIHRoaXMuX3RleHRMYXllciA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIEwuQ2lyY2xlTWFya2VyLnByb3RvdHlwZS5vblJlbW92ZS5jYWxsKHRoaXMsIG1hcCk7XG4gIH1cblxufSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBMLlRleHRDaXJjbGUgPSBDaXJjbGU7XG5MLnRleHRDaXJjbGUgPSAodGV4dCwgbGF0bG5nLCBvcHRpb25zKSA9PiBuZXcgQ2lyY2xlKHRleHQsIGxhdGxuZywgb3B0aW9ucyk7XG4iLCJjb25zdCBMID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ0wnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ0wnXSA6IG51bGwpO1xuY29uc3QgQ2lyY2xlID0gcmVxdWlyZSgnLi9jaXJjbGUnKTtcblxuY29uc3QgTGFiZWxlZE1hcmtlciA9IEwuRmVhdHVyZUdyb3VwLmV4dGVuZCh7XG5cbiAgb3B0aW9uczoge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtICB7TGFiZWxlZE1hcmtlcn0gbWFya2VyXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgZmVhdHVyZVxuICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRMYWJlbFRleHQ6IChtYXJrZXIsIGZlYXR1cmUpID0+IGZlYXR1cmUucHJvcGVydGllcy50ZXh0LFxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtICB7TGFiZWxlZE1hcmtlcn0gbWFya2VyXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgZmVhdHVyZVxuICAgICAqIEBwYXJhbSAge0wuTGF0TG5nfSAgICAgIGxhdGxuZ1xuICAgICAqIEByZXR1cm4ge0wuTGF0TG5nfVxuICAgICAqL1xuICAgIGdldExhYmVsUG9zaXRpb246IChtYXJrZXIsIGZlYXR1cmUsIGxhdGxuZykgPT4ge1xuICAgICAgcmV0dXJuIGZlYXR1cmUucHJvcGVydGllcy5sYWJlbFBvc2l0aW9uID9cbiAgICAgICAgTC5sYXRMbmcoZmVhdHVyZS5wcm9wZXJ0aWVzLmxhYmVsUG9zaXRpb24uc2xpY2UoKS5yZXZlcnNlKCkpIDpcbiAgICAgICAgbGF0bG5nO1xuICAgIH0sXG5cbiAgICBsYWJlbFBvc2l0aW9uS2V5OiAnbGFiZWxQb3NpdGlvbicsXG5cbiAgICBtYXJrZXJPcHRpb25zOiB7XG4gICAgICBjb2xvcjogJyNmMDAnLFxuICAgICAgZmlsbE9wYWNpdHk6IDAuNzUsXG4gICAgICByYWRpdXM6IDE1XG4gICAgfVxuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBjbGFzcyBMYWJlbGVkTWFya2VyXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAZXh0ZW5kcyB7TC5GZWF0dXJlR3JvdXB9XG4gICAqXG4gICAqIEBwYXJhbSAge0wuTGF0TG5nfSBsYXRsbmdcbiAgICogQHBhcmFtICB7T2JqZWN0PX0gIGZlYXR1cmVcbiAgICogQHBhcmFtICB7T2JqZWN0PX0gIG9wdGlvbnNcbiAgICovXG4gIGluaXRpYWxpemUobGF0bG5nLCBmZWF0dXJlLCBvcHRpb25zKSB7XG4gICAgTC5VdGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHRoaXMuZmVhdHVyZSA9IGZlYXR1cmUgfHwge1xuICAgICAgdHlwZTogJ0ZlYXR1cmUnLFxuICAgICAgcHJvcGVydGllczoge30sXG4gICAgICBnZW9tZXRyeToge1xuICAgICAgICAndHlwZSc6ICdQb2ludCdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0wuTGF0TG5nfVxuICAgICAqL1xuICAgIHRoaXMuX2xhdGxuZyA9IGxhdGxuZztcblxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0NpcmNsZUxhYmVsfVxuICAgICAqL1xuICAgIHRoaXMuX21hcmtlciA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7TC5Qb2ludH1cbiAgICAgKi9cbiAgICB0aGlzLl9pbml0aWFsRGlzdGFuY2UgPSBudWxsO1xuXG4gICAgdGhpcy5fY3JlYXRlTGF5ZXJzKCk7XG4gICAgTC5MYXllckdyb3VwLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcyxcbiAgICAgIFt0aGlzLl9tYXJrZXJdKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMLkxhdExuZ31cbiAgICovXG4gIGdldExhYmVsUG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX21hcmtlci5nZXRMYXRMbmcoKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtMLkxhdExuZ31cbiAgICovXG4gIGdldExhdExuZygpIHtcbiAgICByZXR1cm4gdGhpcy5fbGF0bG5nO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0XG4gICAqIEByZXR1cm4ge0xhYmVsZWRNYXJrZXJ9XG4gICAqL1xuICBzZXRUZXh0KHRleHQpIHtcbiAgICB0aGlzLl9tYXJrZXIuc2V0VGV4dCh0ZXh0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGxhYmVsXG4gICAqL1xuICBfY3JlYXRlTGF5ZXJzKCkge1xuICAgIGNvbnN0IG9wdHMgPSB0aGlzLm9wdGlvbnM7XG4gICAgY29uc3QgcG9zICA9IG9wdHMuZ2V0TGFiZWxQb3NpdGlvbih0aGlzLCB0aGlzLmZlYXR1cmUsIHRoaXMuX2xhdGxuZyk7XG4gICAgY29uc3QgdGV4dCA9IG9wdHMuZ2V0TGFiZWxUZXh0KHRoaXMsIHRoaXMuZmVhdHVyZSk7XG5cbiAgICB0aGlzLl9tYXJrZXIgPSBuZXcgQ2lyY2xlKHRleHQsIHBvcyxcbiAgICAgIEwuVXRpbC5leHRlbmQoe1xuICAgICAgICBpbnRlcmFjdGl2ZTogdGhpcy5vcHRpb25zLmludGVyYWN0aXZlXG4gICAgICB9LFxuICAgICAgICBMYWJlbGVkTWFya2VyLnByb3RvdHlwZS5vcHRpb25zLm1hcmtlck9wdGlvbnMsXG4gICAgICAgIG9wdHMubWFya2VyT3B0aW9ucylcbiAgICApO1xuICB9LFxuXG59KTtcblxuXG4vKipcbiAqIEBwYXJhbSAge09iamVjdH0gZmVhdHVyZVxuICogQHBhcmFtICB7U3RyaW5nPX0ga2V5XG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbmZ1bmN0aW9uIHRvR2VvbWV0cnlDb2xsZWN0aW9uKGZlYXR1cmUsIGtleSkge1xuICBrZXkgPSBrZXkgfHwgJ2xhYmVsUG9zaXRpb24nO1xuICBsZXQgbGFiZWxQb3MgID0gZmVhdHVyZS5wcm9wZXJ0aWVzW2tleV07XG5cbiAgaWYgKCFsYWJlbFBvcykgdGhyb3cgbmV3IEVycm9yKCdObyBsYWJlbCBwb3NpdGlvbiBzZXQnKTtcblxuICBsYWJlbFBvcyA9IGxhYmVsUG9zLnNsaWNlKCk7XG4gIGNvbnN0IGdlb21ldHJpZXMgPSBbXG4gICAge1xuICAgICAgdHlwZTogJ1BvaW50JyxcbiAgICAgIGNvb3JkaW5hdGVzOiBsYWJlbFBvcy5zbGljZSgpXG4gICAgfSwge1xuICAgICAgdHlwZTogJ1BvaW50JyxcbiAgICAgIGNvb3JkaW5hdGVzOiBsYWJlbFBvcy5zbGljZSgpXG4gICAgfV07XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnRmVhdHVyZScsXG4gICAgcHJvcGVydGllczogTC5VdGlsLmV4dGVuZCh7fSwgZmVhdHVyZS5wcm9wZXJ0aWVzLCB7XG4gICAgICBnZW9tZXRyaWVzVHlwZXM6IFsnY29ubmVjdGlvbicsICdsYWJlbCcsICd0ZXh0Ym94J11cbiAgICB9KSxcbiAgICBiYm94OiBmZWF0dXJlLmJib3gsXG4gICAgZ2VvbWV0cnk6IHtcbiAgICAgIHR5cGU6ICdHZW9tZXRyeUNvbGxlY3Rpb24nLFxuICAgICAgZ2VvbWV0cmllczogZ2VvbWV0cmllc1xuICAgIH1cbiAgfTtcbn1cblxuTGFiZWxlZE1hcmtlci50b0dlb21ldHJ5Q29sbGVjdGlvbiA9IHRvR2VvbWV0cnlDb2xsZWN0aW9uO1xuXG5MLkxhYmVsZWRDaXJjbGVNYXJrZXIgPSBMYWJlbGVkTWFya2VyO1xuTC5sYWJlbGVkQ2lyY2xlTWFya2VyID0gKGxhdGxuZywgZmVhdHVyZSwgb3B0aW9ucykgPT4ge1xuICByZXR1cm4gbmV3IExhYmVsZWRNYXJrZXIobGF0bG5nLCBmZWF0dXJlLCBvcHRpb25zKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTGFiZWxlZE1hcmtlcjtcbiJdfQ==
