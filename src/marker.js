const L = require('leaflet');
const Circle = require('./circle');

const LabeledMarker = L.FeatureGroup.extend({

  options: {

    /**
     * @param  {LabeledMarker} marker
     * @param  {Object}        feature
     * @return {String}
     */
    getLabelText: (marker, feature) => feature.properties.text,

    /**
     * @param  {LabeledMarker} marker
     * @param  {Object}        feature
     * @param  {L.LatLng}      latlng
     * @return {L.LatLng}
     */
    getLabelPosition: (marker, feature, latlng) => {
      return feature.properties.labelPosition ?
        L.latLng(feature.properties.labelPosition.slice().reverse()) :
        latlng;
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
  initialize(latlng, feature, options) {
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
    L.LayerGroup.prototype.initialize.call(this,
      [this._marker]);
  },


  /**
   * @return {L.LatLng}
   */
  getLabelPosition() {
    return this._marker.getLatLng();
  },


  /**
   * @return {L.LatLng}
   */
  getLatLng() {
    return this._latlng;
  },


  /**
   * @param {String} text
   * @return {LabeledMarker}
   */
  setText(text) {
    this._marker.setText(text);
    return this;
  },


  /**
   * Creates label
   */
  _createLayers() {
    const opts = this.options;
    const pos  = opts.getLabelPosition(this, this.feature, this._latlng);
    const text = opts.getLabelText(this, this.feature);

    this._marker = new Circle(text, pos,
      L.Util.extend({
        interactive: this.options.interactive
      },
        LabeledMarker.prototype.options.markerOptions,
        opts.markerOptions)
    );
  },

});


/**
 * @param  {Object} feature
 * @param  {String=} key
 * @return {Object}
 */
function toGeometryCollection(feature, key) {
  key = key || 'labelPosition';
  let labelPos  = feature.properties[key];

  if (!labelPos) throw new Error('No label position set');

  labelPos = labelPos.slice();
  const geometries = [
    {
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
L.labeledCircleMarker = (latlng, feature, options) => {
  return new LabeledMarker(latlng, feature, options);
};

module.exports = LabeledMarker;
