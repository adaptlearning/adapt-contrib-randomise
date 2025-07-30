import Logging from 'core/js/logging';
import {
  LifecycleSet,
  StateSetModelChildren
} from 'extensions/adapt-contrib-scoring/js/adapt-contrib-scoring';

export default class RandomisedSet extends LifecycleSet {

  initialize(options = {}) {
    super.initialize({
      ...options,
      _type: 'randomise'
    });
    if (!this.isAwaitingChildren) return;
    Logging.error(`Models cannot be added dynamically when using randomisation. Please check config for ${this.modelId}.`);
  }

  /**
   * Fetch the config object from the set model.
   * @returns {Object}
   */
  get config() {
    return this.model.get('_randomise');
  }

  /**
   * Create a state object which saves and restores the set models.
   * @type {StateSetModelChildren}
   */
  get state() {
    if (this.isIntersectedSet) return;
    return (this._state = this._state || new StateSetModelChildren({ set: this }));
  }

  /** @override */
  get order() {
    // 300 is larger than banking (200) and AdaptModelSet (< 100) but lower than scoringAssessment (500)
    return 300;
  }

  /**
   * @override
   */
  async onRestore() {
    if (!this.isEnabled) return false;
    if (!this.state.restore()) return false;
    await super.onRestore();
    return true;
  }

  /** @override */
  async onStart() {
    if (!this.isEnabled) return;
    const pluckCount = this.config?._pluckCount ?? 0;
    let models = this.availableModels;
    models = _.shuffle(models);
    if (pluckCount !== 0) {
      models = this._pluck(models, pluckCount);
    }
    this.model.getChildren().reset(models);
    this.state.save();
    await super.onStart();
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

  /** @override */
  async onVisit() {
    const shouldRefreshOnRevisit = this.config._shouldRefreshOnRevisit ?? false;
    if (!shouldRefreshOnRevisit) return;
    await this.reset();
  }
}
