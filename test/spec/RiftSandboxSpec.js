// To run enter the following URL into the browser:
// http://localhost:<server-port-num>/test/SpecRunner.html
//
// To run an individual spec:
// http://localhost:<server-port-num>/test/SpecRunner.html?spec=toggleTextArea

"use strict";

define([
  'RiftSandbox'
],
 function (RiftSandbox) {

   // we want to set canvas up once for all describes
   var canvas;
   canvas = document.createElement('canvas');
   canvas.setAttribute('id', 'viewer');
   
   document.body.appendChild(canvas);
   
   describe("toggleTextArea", function () {
     var rs;
     var ta;

    beforeEach(function(done) {
      require([
      ], function() {
        
        ta = document.createElement('TEXTAREA');
        ta.setAttribute('name', 'dummy-ta');

        rs = new RiftSandbox(100, 100, ta, function() {"dummy"});
        rs.name = "test-rs";
        
        done();
      });
    });    
    
    it("toggles textArea visibility", function() {
      rs.toggleTextArea(false);

      expect(rs.textArea.object.visible).toEqual(false);

      rs.toggleTextArea(true);
      expect(rs.textArea.object.visible).toEqual(true);
    });
   }); // end describe function

   describe("Asynchronous specs", function() {
     var value;
     var origWarnLog;
     var msgs='';
     var rs;
     var ta;
     document.msgs = '';
     
     beforeEach(function(done) {
       value = 0;
       origWarnLog = console.warn;
       
       ta = document.createElement('TEXTAREA');
       ta.setAttribute('name', 'dummy-ta');

       rs = new RiftSandbox(1, 1, ta, function() {"dummy"});
       rs.name = "test-rs";

       // trap warn messages
       window.console.warn = function(msg) {
         document.msgs += msg;
       };

       rs.render();
       
       // give render some time to generate any messages, then call the spec
       setTimeout(function () {
         done();
       },1000);
     });

     afterEach(function(done) {
       console.log("RiftSandboxSpec.afterEach: now restoring warn console");
       // restore warn
       window.console.warn = origWarnLog;
       done();
     });
     
     it("should not generate warning messages", function(done) {
       expect(document.msgs.match("Texture is not power of two")).toBe(null);

       done();
     });
   });

   
 }); // end define























