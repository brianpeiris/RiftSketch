'use strict';
// Requirejs Configuration Options
require.config({
  // to set the default folder
  baseUrl: '../js', 
  // paths: maps ids with paths (no extension)
  paths: {
      'jasmine': ['../bower_components/jasmine/lib/jasmine-core/jasmine'],
      'jasmine-html': ['../bower_components/jasmine/lib/jasmine-core/jasmine-html'],
      'jasmine-boot': ['../bower_components/jasmine/lib/jasmine-core/boot'],
    // Note: the paths here are relative to the SpecRunner.html dir not the dir this
    // file is located in.
      Three: '../lib/three',
      VRControls: '../lib/VRControls',
      WebVRManager: '../lib/webvr-manager',
      VREffect: '../lib/VREffect',
      WebVRPolyfill: '../lib/webvr-polyfill'
  },
  // shim: makes external libraries compatible with requirejs (AMD)
  shim: {
    'jasmine-html': {
      deps : ['jasmine']
    },
    'jasmine-boot': {
      deps : ['jasmine', 'jasmine-html']
    },
    Three: {exports: 'THREE'},
    WebVRPolyfill: {deps: ['Three']},
    VRControls: {deps: ['Three']},
    VREffect: {deps: ['Three']},
    WebVRManager: {exports: 'WebVRManager'}
  }
});

require(['jasmine-boot'
        ], function () {

  require([
    'spec/RiftSandboxSpec.js'], function(){
    //trigger Jasmine
    window.onload();
  });  
});
