/* global require */
(function () {
  'use strict';
  require('!style!css!bootstrap/dist/css/bootstrap.css');
  require('!style!css!../css/index.css');
  var SketchController = require('./SketchController');
  new SketchController();
}());
