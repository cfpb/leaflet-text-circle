const L = require('leaflet');
const Circle = require('./circle');

const CircleTextMarker = L.FeatureGroup.extend({

  options: {

    /**
     * @param  {CircleTextMarker} marker
     * @param  {Object}        feature
     * @return {String}
     */
    getLabelText: (marker, feature) => feature.properties.text,

    /**
     * @param  {CircleTextMarker} marker
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
   * @class CircleTextMarker
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
   * @return {CircleTextMarker}
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
        CircleTextMarker.prototype.options.markerOptions,
        opts.markerOptions)
    );
  },

});

L.TextCircleMarker = CircleTextMarker;
L.textCircleMarker = (latlng, feature, options) => {
  return new CircleTextMarker(latlng, feature, options);
};

module.exports = CircleTextMarker;
