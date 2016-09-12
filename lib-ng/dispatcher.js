import Backbone from 'alloy/backbone';
import _ from 'alloy/underscore';

const dispatcher = () => _.clone(Backbone.Events);
export default dispatcher;
