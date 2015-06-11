// To run enter the following URL into the browser:
// http://localhost:<server-port-num>/test/SpecRunner.html
//
// To run an individual spec:
// http://localhost:<server-port-num>/test/SpecRunner.html?spec=toggleTextArea

"use strict";

// var root_dir = "RiftSketchSandBox/";

// console.log("RSUtilsSpec: point a");

// require.config({
//   //baseUrl: "projects/RiftSketchSandBox/spec",
//   //baseUrl: "../../",
//    baseUrl: '',
//   //baseUrl: "../../js",
//   //urlArgs: 'cb=' + Math.random(),
//   paths: {
//     //RSUtils: 'RSUtils',
//     RiftSandbox: 'js/RiftSandbox',
//     //Three: root_dir + 'lib/three'
//     //Three: '/projects/RiftSketchSandBox/lib/three'
//     Three: '../lib/three'
//   },
//   shim: {
//     //RSUtils: {exports: 'RSUtils'},
//     //RiftSandbox: {exports: 'RiftSandbox'},
//     Three: {exports: 'THREE'}
//   }
// });

// console.log("RSUtilsSpec: point b");

//var my_rs;
// define([
//   'Three',

//   'TextArea',
//   'WebVRManager',
// ],
// function (
//   THREE,
//   TextArea,

//   WebVRManager
// ) {


define([
//require([
  'RiftSandbox'
//  THREE
],
 function (RiftSandbox) {

  //var riftSandbox = new RiftSandbox();
   // we want to set canvas up once for all describes
   var canvas;
   canvas = document.createElement('canvas');
   canvas.setAttribute('id', 'viewer');
   //console.log("RiftSandboxSpec.js.beforeEach: canvas.getContext('webgl')=" + canvas.getContext('webgl'));
   document.body.appendChild(canvas);
   
   describe("toggleTextArea", function () {
     //var canvas;
     var rs;
     var ta;

    // need to have a canvas defined in the dom, otherwise get alert
    // "this applications needs WebGL defined"
    // beforeAll(function() {
    //   require([], function() {
    //     canvas = document.createElement('canvas');
    //     canvas.setAttribute('id', 'viewer');
    //     console.log("RiftSandboxSpec.js.beforeEach: canvas.getContext('webgl')=" + canvas.getContext('webgl'));
    //     document.body.appendChild(canvas);
    //  });
    // });
              
    beforeEach(function(done) {
      require([
        //THREE
        //WebVRManager
        ], function() {
        // canvas = document.createElement('canvas');
        // canvas.setAttribute('id', 'viewer');
        // console.log("RiftSandboxSpec.js.beforeEach: canvas.getContext('webgl')" + canvas.getContext('webgl'));
        // document.body.appendChild(canvas);
        // var node = document.createTextNode("This is new.");
        // canvas.appendChild(node);
        
        ta = document.createElement('TEXTAREA');
        ta.setAttribute('name', 'dummy-ta');

        rs = new RiftSandbox(100, 100, ta, function() {"dummy"});
        //rs.setAttribute('name', 'test-rs');
        rs.name = "test-rs";
        
        done();
      });
    });    
    //var riftSandbox = new RiftSandbox();
    it("toggles textArea visibility", function() {
      // console.log("RiftSandboxSpec.js: ta.name=" + ta.name);
      // console.log("RiftSandboxSpec.js: rs.name=" + rs.name);
      // console.log("RiftSandboxSpec.js: rs.textArea.object.visible pre=" + rs.textArea.object.visible);
      
      //var oldVisibility = rs.textArea.object.visible;
      
      rs.toggleTextArea(false);
      //console.log("RiftSandboxSpec.js: rs.textArea.object.visible post=" + rs.textArea.object.visible);
      
      //expect(rs.textArea.object.visible).toEqual(!oldVisibility);
      expect(rs.textArea.object.visible).toEqual(false);

      rs.toggleTextArea(true);
      expect(rs.textArea.object.visible).toEqual(true);

      // var angle = riftSandbox.angleRangeRad(Math.PI / 4.0);

      // expect(angle).toEqual(angle);
      //console.log("scene.children[0] in ut=" + scene.children[0]);
      //expect(RSUtils.helloWorld()).toEqual("Hello world!");
    });

/*     
    it("takes a long time", function(done) {
      setTimeout(function() {
        done();
      }, 9000);
    }, 10000);
     

     var rs = new Rif
     document.msgs = '';
     window.console.warn = function (msg) {
       document.msgs += msg;
     };
       
       console.log("RiftSandboxSpec.js: about to call render, document.msgs.length=" + document.msgs.length);
       rs.render();
       console.log("document.msgs=" + document.msgs);

     setTimeout(function(){
     it("Does not generate 'Texture is not power of two' message on console", function() {
       //document.msgs = '';
       var oldLog = window.console.warn;
       
       //(function(){
       // window.console.warn = function (msg) {
       //   // DO MESSAGE HERE.
       //   document.msgs += msg;
       //   //oldLog.apply(console, arguments);
       // };
       // //})();
       // // window.console = {
       // //   //log = function(msg) {...},
       // //   //info = function(msg) {...},
       // //   warn = function(msg) {document.msgs += msg;}
         
       // // };
       
       // console.log("RiftSandboxSpec.js: about to call render, document.msgs.length=" + document.msgs.length);
       // rs.render();
       // console.log("document.msgs=" + document.msgs);
       // setTimeout(function(){
       //   console.log("document.msgs after sleep=" + document.msgs);
       //   expect(document.msgs.match("Texture is not power of two")).toBe(null);
       // }, 2000);
       console.log("RiftSandboxSpec.js: back from render, document.msgs.length==" + document.msgs.length);

       // restore original log
       console.log.warn = oldLog;
       console.log("RiftSandboxSpec.js: leaving, document.msgs.length==" + document.msgs.length);
       console.log("RiftSandboxSpec.js: leaving, document.msgs first 40 bytest==" + document.msgs.slice(0,39));
       //var re = /Texture is not power of two/;
       //var re = new RegExp(/RiftSandboxSpec\.js/);
       var re = new RegExp(/Texture is not power of two/);
       console.log("RiftSandboxSpec.js: document.msgs contains Texture is not power of two=" + document.msgs.match("Texture is not power of two") != null
//                   re.test(document.msgs
                          );
       
       console.log("document.msgs.match=" + document.msgs.match("Texture is not power of two"));
       expect(document.msgs.match("Texture is not power of two")).not.toBe(null);
       //);
       
     });
    }, 2000);   
*/
   }); // end describe function

   describe("Asynchronous specs", function() {

     var value;
     var origWarnLog;
     var msgs='';
     var rs;
     var ta;
     document.msgs = '';
     
     beforeEach(function(done) {
      // setTimeout(function() {
         value = 0;
         origWarnLog = console.warn;
         
         ta = document.createElement('TEXTAREA');
         ta.setAttribute('name', 'dummy-ta');

         rs = new RiftSandbox(1, 1, ta, function() {"dummy"});
         //rs.setAttribute('name', 'test-rs');
         rs.name = "test-rs";

         // trap warn messages
         window.console.warn = function(msg) {
           document.msgs += msg;
         };

         console.log("RiftSandboxSpec.js: about to call render, document.msgs.length=" + document.msgs.length);
         rs.render();
         console.log(".document.msgs.length (immediately after render)=" + document.msgs.length);

       // give render some timeto generate any messages, then call the spec
       setTimeout(function () {
           done();
       },1000);
         
       //}, 2000);
     });

   afterEach(function(done) {
     console.log("RiftSandboxSpec.afterEach: now restoring warn console");
     // restore warn
     window.console.warn = origWarnLog;
     done();
   });
     
     it("should support async execution of test preparation and expectations", function(done) {
       //value++;
       //expect(value).toBeGreaterThan(0);
       console.log(".document.msgs.length (in it)=" + document.msgs.length);
       expect(document.msgs.match("Texture is not power of two")).toBe(null);

       // // restore warn
       // window.console.warn = origWarnLog;

       done();
     });
     
   });

   
 }); // end define
//   });
/*
//require(['RSUtils'], function (RSUtils) {
define(['RSUtils'], function (RSUtils) {  
  console.log("RSUtilsSpec: point c");
  //console.log("abc=" + RSUtils.helloWorld());
  console.log("RSUtilsSpec: RSUtils.x=" + RSUtils.x);
  var a = new RSUtils();
  //my_rs = new RSUtils(); return;
  
  console.log("RSUtilsSpec: a=" + a);
  console.log("RSUtilsSpec: a.helloWorld()=" + a.helloWorld());

  console.log("RSUtilsSpec: about to call expect");
  //var r = it("abc", function() {expect(rsUtils.helloWorld()).toEqual("Hello world!");});
  // Note: this fukcking works!
  var r = it("abd", function() {expect((new RSUtils ()).helloWorld()).toEqual("Hello world!");});

  
  console.log("RSUtilsSpec: r=" + r);
  //console.log("RSUtilsSpec: expect result = " + expect(a.helloWorld()).toEqual("Hello world!"));
  console.log("RSUtilsSpec: just called expect");

  //return RSUtils;
  //return a;
  
  var foo = function () {
    describe("Hello world", function() {
      var rsUtils = new RSUtils();
      it("says hello", function() {
        expect(rsUtils.helloWorld()).toEqual("Hello world!");
        //expect(RSUtils.helloWorld()).toEqual("Hello world!");
      });
    }
   )};

  var rs;
  
   beforeEach(function(done) {
        require(['RSUtils'], function(rsUtils) {
            rs = new rsUtils();
            done();
        });
   });


    it("should know if list is empty", function() {
      var rs = new RSUtils();
        expect(rs.helloWorld()).toEqual("Hello world!");
    });

  describe("Hello world", function () {
    var rsUtils = new RSUtils();
    it("says hello", function() {
      expect(rsUtils.helloWorld()).toEqual("Hello world!");
      //console.log("scene.children[0] in ut=" + scene.children[0]);
      //expect(RSUtils.helloWorld()).toEqual("Hello world!");
    });
  });
  
  describe("getSceneObject", function() {
    var scene;
    var cubeMesh;
    var rsUtils = new RSUtils();
    
    beforeAll(function() {
      //var scene, cubeMesh;

      scene =  new THREE.Scene();
      scene.name = "jasmine_fixture";

      cubeMesh = new THREE.Mesh(
        new THREE.BoxGeometry( 1, 1, 1 ),
	    new THREE.MeshBasicMaterial({}) );

      cubeMesh.name = "abc";

      scene.add(cubeMesh);
      
      cubeMesh = new THREE.Mesh(
        new THREE.BoxGeometry( 2, 2, 2 ),
	    new THREE.MeshBasicMaterial({}) );

      cubeMesh.name = "def";

      scene.add(cubeMesh);

      console.log("scene a=" + scene);
    });

    it("returns the proper thing", function() {
      //expect(rsUtils.getSceneObject({scene: scene, name: "abc"})).toEqual("scene=jasmine_fixture,name=abc");
      //console.log("scene.children[0].name in ut=" + scene.children[0].name);
      //expect(RSUtils.helloWorld()).toEqual("Hello world!");
      //console.log("rsUtils.getSceneObject({scene: scene, name: \"abc\"})).name = " + rsUtils.getSceneObject({scene: scene, name: "abc"}).name);
      var result;
      
      result = rsUtils.getSceneObject({scene: scene, name: "abc"});
      expect(result.name).toEqual("abc");
      expect(result.geometry.parameters.width).toEqual(1);
      
      expect(rsUtils.getSceneObject({scene: scene, name: "def"}).name).toEqual("def");
      expect(rsUtils.getSceneObject({scene: scene, name: "def"}).geometry.parameters.width).toEqual(2);

      // not found scenario
      result = rsUtils.getSceneObject({scene: scene, name: "xyz"});
      expect(result).toBeUndefined();
      
      
    });
  }
            );
  console.log("RSUtilsSpec: leaving stanza");
  //return foo();
  
});
*/
// console.log("RSUtilsSpec: point d: my_rs=" + my_rs);
// //var my_rs_instance = new my_rs();
// //console.log("RSUtilsSpec: point d: my_rs_instance=" + my_rs_instance);

//     describe("Hello world", function() {
//       //var rsUtils = new RSUtils();
//       it("says hello", function() {
//         expect(my_rs.helloWorld()).toEqual("Hello world!");
//         //expect(RSUtils.helloWorld()).toEqual("Hello world!");
//       });
//     }
//             );


// describe("A suite is just a function", function() {
// 		var a;

// 		it("and so is a spec", function() {
// 			a = true;

// 			expect(a).toBe(true);
// 			});
//         }
// );

//       );
/*
describe("getSceneObject", function() {
  var a;
  var scene;
  var cubeMesh;

  beforeAll(function() {
    //var scene, cubeMesh;

    scene =  new THREE.Scene();

    cubeMesh = new THREE.Mesh(
      new THREE.BoxGeometry( 1, 1, 1 ),
	  new THREE.MeshBasicMaterial({}) );

    cubeMesh.name = "abc";

    scene.add(cubeMesh);
    
    cubeMesh = new THREE.Mesh(
      new THREE.BoxGeometry( 2, 2, 2 ),
	  new THREE.MeshBasicMaterial({}) );

    cubeMesh.name = "def";

    scene.add(cubeMesh);

    console.log("scene a=" + scene);
  });

  
  it("dummy", function() {
	a = true;
	expect(a).toBe(true);

    console.log("scene b=" + scene);
  });


  it("returns the proper object", function() {
    var cube;
    
    cube = getSceneObject({scene: scene, name: "abc"});
     
    expect(cube.width.toEqual(1));
    expect(cube.name.toEqual("abc"));

    cube = getSceneObject({scene: scene, name: "def"});
           
    expect(cube.width.toEqual(2));
    expect(cube.name.toEqual("def"));    
  });  
  

});
*/ 
  




















