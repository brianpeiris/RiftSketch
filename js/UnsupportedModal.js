define([
  'backbone',
  'raw!../templates/unsupported_modal.html'
],
function (Backbone, template) {
  'use strict';
  var UnsupportedModal = Backbone.View.extend({
    template: _.template(template),
    events: {
      'click #continue': 'continueUnsupported'
    },
    render: function () {
      this.$el.html(this.template());
      return this;
    },
    continueUnsupported: function () {
      localStorage.setItem('alreadyIgnoredUnsupported', true);
      this.remove();
    }
  });
  return UnsupportedModal;
});
