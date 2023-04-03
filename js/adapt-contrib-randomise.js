import Adapt from 'core/js/adapt';
import Data from 'core/js/data';
import RandomisedSet from './RandomisedSet';

class Randomise extends Backbone.Controller {

  initialize() {
    this.listenTo(Adapt, {
      'app:dataReady': this.onAppDataReady
    });
  }

  onAppDataReady() {
    const models = Data.filter(model => model.get('_randomise')?._isEnabled);
    models.forEach(model => new RandomisedSet({ model }));
  }

}

export default new Randomise();