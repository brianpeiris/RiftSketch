/* global require */

require.config({
  waitSeconds: 30,
  baseUrl: '',
  urlArgs: 'bust=' + (new Date()).getTime(),
  paths: {
    firebase: 'bower_components/firebase/firebase',
    jquery: 'bower_components/jquery/dist/jquery',
    leap: 'bower_components/leapjs/leap-0.6.4',
    leapjsplugins: 'bower_components/leapjs-plugins/main/leap-plugins-0.1.11pre',
    oauth: 'bower_components/oauth-js/dist/oauth',
    lodash: 'bower_components/lodash/dist/lodash',
    text: 'bower_components/requirejs-text/text',

    kibo: 'lib/kibo',
    Three: 'bower_components/threejs/build/three',
    VRControls: 'lib/VRControls',
    VREffect: 'lib/VREffect',
    WebVRPolyfill: 'lib/webvr-polyfill',
    WebVRManager: 'lib/webvr-manager'
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
    WebVRManager: {exports: 'WebVRManager'}
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
