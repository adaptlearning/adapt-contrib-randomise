import Adapt from 'core/js/adapt';
import Logging from 'core/js/logging';
import ModifierSet from 'extensions/adapt-contrib-modifiers/js/ModifierSet';

export default class RandomisedSet extends ModifierSet {

  initialize(options = {}) {
    super.initialize({
      ...options,
      _type: 'randomise'
    });
    if (this.isAwaitingChildren) {
      Logging.error(`Models cannot be added dynamically when using randomisation. Please check config for ${this.modelId}.`);
      return;
    }
  }

  /**
   * @override
   */
  setupModels() {
    if (!this.isEnabled) return;
    let models = [];
    const savedModels = this._getSavedModels();
    if (savedModels) {
      models = savedModels
    } else {
      models = this.originalModels.filter(model => model.getAncestorModels(true).every(model => model.get('_isAvailable')));
      if (this._pluckCount !== 0) {
        models = this._shuffle(models);
        models = this._pluck(models, this._pluckCount);
      }
    }
    this.models = models;
    this._saveState();
  }

  /**
   * @override
   */
  get order() {
    return 2;
  }

  /**
   * @extends
   */
  get models() {
    return super.models;
  }

  /**
   * @extends
   */
  set models(list) {
    super.models = list;
    this.collection.reset(this._shuffle(this.originalModels));
  }

  /**
   * @override
   */
  _initConfig() {
    this._config = this.model.get('_randomise');
    this._pluckCount = this._config?._pluckCount ?? 0;
    this._shouldRefreshOnRevisit = this._config._shouldRefreshOnRevisit ?? false;
  }

  /**
   * @extends
   */
  _setupListeners() {
    super._setupListeners();
    if (this._shouldRefreshOnRevisit) this.listenTo(Adapt, 'router:location', this.onRouterLocation);
    this.listenTo(this.model, 'change:_randomise', this.onModelConfigChange);
  }

  /**
   * Returns a shuffled list
   * @private
   * @param {Array} list
   * @returns {[AdaptModel]}
   */
  _shuffle(list) {
    return _.shuffle(list);
  }

  /**
   * Returns a list condensed to the `count`.
   * Negative counts will remove that number of items from the list.
   * @private
   * @param {Array} list
   * @param {Number} count The number of items to pluck from the list
   * @returns {[AdaptModel]}
   */
  _pluck(list, count) {
    if (isNaN(count)) throw Error(`Invalid count to pluck for ${this.modelId}`);
    if (list.length < Math.abs(count)) throw Error(`Insufficient models to pluck for ${this.modelId}`);
    if (count) list = list.slice(0, count);
    return list;
  }

  /**
   * @todo Refresh doesn't work with trickle due to execution order
   * @param {Object} location
   * @listens Adapt#router:location
   */
  async onRouterLocation(location) {
    this.originalModels.forEach(model => delete model._isAvailableChange);
    if (location._contentType !== 'page') return;
    const model = location._currentModel;
    // check the model exists in this location
    if (!(model.getAllDescendantModels(true).some(model => model === this.model))) return;
    this._triggerModelRefresh();
  }

}
