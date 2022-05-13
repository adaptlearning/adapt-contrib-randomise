import Adapt from 'core/js/adapt';
import Logging from 'core/js/logging';
import OfflineStorage from 'core/js/offlineStorage';

export default class RandomisedSet extends Backbone.Controller {

  initialize(options = {}) {
    this._model = options.model;
    if (!this.originalModels) this.model.set('_originalModels', this.model.getChildren().toArray());

    if (!this.isAllModelsAdded) {
      Logging.error(`Models cannot be added dynamically when using randomisation. Please check config for ${this.model.get('_id')}.`);
      return;
    }

    this._initConfig();
    this._setupListeners();
  }

  /**
   * @private
   */
  _initConfig() {
    this._config = this.model.get('_randomise');
    //this._isEnabled = this._config?._isEnabled ?? false;
    this._pluckCount = this._config?._pluckCount ?? 0;
  }

  /**
   * @private
   */
   _setupListeners() {
    if (OfflineStorage.ready) {
      this.onOfflineStorageReady();
    } else {
      this.listenTo(Adapt, {
        'offlineStorage:ready': this.onOfflineStorageReady
      });
    }

    this.listenTo(Adapt, {
      'assessment:reset': this.onAssessmentReset
    });
  }

  /**
   * @private
   * @todo Should models only be setup when associated model is rendered?
   * @todo Only re-randomise once completed? Option to randomise each time (if used outside of an assessment)?
   * @todo Do we need to guarantee that randomisation occurs after banking without a dependency? Uses `models` rather than `originalModels` so probably not.
   * @todo Not workng when using `adapt-banking` as uses restored data without shuffling.
   */
  _setupModels() {
    let models = [];
    const storedData = OfflineStorage.get(this.saveStateName)?.[this.model.get('_id')];

    if (storedData) {
      const trackingIds = OfflineStorage.deserialize(storedData);
      models = trackingIds.map(trackingId => this.models.find(model => model.get('_trackingId') === trackingId));
    } else {
      models = this._shuffle(this.models);
      models = this._pluck(models, this._pluckCount);
    }

    this.models = models;
    this._saveState();
  }

  /**
   * Returns a shuffled list
   * @private
   * @param {Array} list
   * @returns {Array}
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
   * @returns {Array}
   */
   _pluck(list, count) {
    if (list.length < Math.abs(count)) throw Error(`Insufficient models to pluck for ${this.model.get('_id')}`);
    if (count) list = list.slice(0, count);
    return list;
  }

  /**
   * Reset models back to their original configuration
   * @todo Add reset config to control when randomisation is reset for non assessment models?
   * @returns {Promise}
   */
  async reset() {
    this.models = null;
    this._saveState();
    this.models = this.originalModels;
    await Adapt.wait.queue();
  }

  /**
   * Returns the model containing the `_randomise` config
   * @returns {AdaptModel}
   */
  get model() {
    return this._model;
  }

  /**
   * Returns the original unmodified child models associated with the model
   * @returns {[AdaptModel]}
   */
   get originalModels() {
    return this.model.get('_originalModels');
  }

  /**
   * Returns current child models associated with the model
   * @returns {[AdaptModel]}
   */
  get models() {
    const models = this.model.getChildren().toArray();
    return models;
    //return models.filter(model => model.get('_isAvailable'));
  }

  /**
   * Set the child models associated with the model
   * @todo Set the models or change `_isAvailable`?
   */
  set models(list) {
    this.model.getChildren().models = list;

    /*
    this.models.forEach(model => {
      const isAvailable = list.includes(model);
      model.set('_isAvailable', isAvailable);
    });
    */
  }

  /**
   * Returns whether all models have been added
   * @returns {Boolean}
   */
   get isAllModelsAdded() {
    return this.model.get('_requireCompletionOf') !== Number.POSITIVE_INFINITY;
  }

  /**
   * Returns the state to save to offlineStorage
   * @todo Component trackingIds instead of block?
   * @returns {[_trackingId]}
   */
   get saveState() {
    return this.models.length > 0 ? this.models.map(model => model.get('_trackingId')) : null
  }

  /**
   * Returns the state name for offlineStorage
   * @note Uses same name as `adapt-banking`
   * @returns {String}
   */
   get saveStateName() {
    return 'restorationIds';
  }

  /**
   * @private
   * @todo Do we need to ensure order is preserved if using randomisation?
   */
  _saveState() {
    const data = OfflineStorage.get(this.saveStateName) ?? {};
    const saveState = this.saveState;
    saveState ? data[this.model.get('_id')] = OfflineStorage.serialize(saveState) : delete data[this.model.get('_id')]
    OfflineStorage.set(this.saveStateName, data);
  }

  /**
   * @listens Adapt#offlineStorage:ready
   */
   onOfflineStorageReady() {
    this._setupModels();
  }

  /**
   * @param {AssessmentSet} assessment
   * @listens Adapt#assessment:reset
   */
  async onAssessmentReset(assessment) {
    if (assessment.model.get('_id') !== this.model.get('_id')) return;
    await this.reset();
    this._setupModels();
  }

}
