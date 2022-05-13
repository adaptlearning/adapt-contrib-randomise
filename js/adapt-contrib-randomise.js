import Adapt from 'core/js/adapt';
import Data from 'core/js/data';
import RandomisedSet from './RandomisedSet';

class Randomise extends Backbone.Controller {

  initialize() {
    this.listenTo(Adapt, {
      'app:dataReady': this.onAppDataReady
    });
  }

  hasRandomisation(model) {
    return this.getConfigByModel(model)?._isEnabled;
  }

  getConfigByModel(model) {
    return model.get('_randomise');
  }

  get randomisedModels() {
    return Data.filter(model => this.hasRandomisation(model));
  }

  onAppDataReady() {
    this.randomisedModels.forEach(model => new RandomisedSet({ model }));
  }

}

export default new Randomise();