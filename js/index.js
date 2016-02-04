/* global require */
var bc = function (path) {
  return 'bower_components/' + path;
};

require.config({
  waitSeconds: 30,
  baseUrl: '',
  // urlArgs: 'bust=' + (new Date()).getTime(),
  paths: {
    firebase: bc('firebase/firebase'),
    jquery: bc('jquery/dist/jquery'),
    leap: bc('leapjs/leap-0.6.4'),
    leapjsplugins: bc('leapjs-plugins/main/leap-plugins-0.1.11pre'),
    oauth: bc('oauth-js/dist/oauth'),
    lodash: bc('lodash/dist/lodash'),
    text: bc('requirejs-text/text'),
    underscore: bc('underscore/underscore'),
    Backbone: bc('backbone/backbone'),

    kibo: 'lib/kibo',
    Three: bc('threejs/build/three'),
    VRControls: bc('threejs/examples/js/controls/VRControls'),
    VREffect: bc('threejs/examples/js/effects/VREffect'),
    WebVRPolyfill: bc('webvr-polyfill/build/webvr-polyfill'),
    WebVRManager: bc('webvr-boilerplate/build/webvr-manager')
  },
  shim: {
    firebase: {exports: 'Firebase'},
    jquery: {exports: 'jQuery'},
    leap: {exports: 'Leap'},
    leapjsplugins: {deps: ['leap']},
    oauth: {exports: 'OAuth'},
    kibo: {exports: 'Kibo'},
    Three: {exports: 'THREE'},
    WebVRPolyfill: {deps: ['Three']},
    VRControls: {deps: ['Three']},
    VREffect: {deps: ['Three']},
    WebVRManager: {deps: ['Three'], exports: 'WebVRManager'}
  }
});

require([
  'js/SketchController'
],
function (
  SketchController
) {
  'use strict';
  new SketchController();
});
