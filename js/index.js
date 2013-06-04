'use strict';

var index = angular.module('index', ['ui.bootstrap', 'ui.codemirror', 'firebase']);

index.directive('sketch', function () {
  return {
    restrict: 'E',
    templateUrl: 'template/sketch.html'
  };
});

var File = (function () {
  var constr = function (name, contents) {
    this.name = name || 'Example';
    this.contents = contents || 'scene.add(\n  new THREE.Mesh(\n    new THREE.CubeGeometry(10, 10, 10)));';
    this.selected = true;
  };
  return constr;
}());

var Sketch = (function () {
  var constr = function (name, files) {
    this.name = name || 'Example Sketch';
    this.files = files || [
      new File()
    ];
  };
  constr.prototype.getCode = function () {
    var code = '';
    for (var i = 0; i < this.files.length; i++) {
      code += this.files[i].contents;
    }
    return code;
  };
  constr.prototype.addFile = function () {
    this.files.push(new File('Untitled', ''));
  };
  return constr;
}());

var SketchController = (function () {
  var constr = function ($scope, $routeParams, angularFireCollection, $location) {
    this.scope = $scope;
    var sketches = angularFireCollection('https://riftsketch.firebaseio.com/sketches');
    $scope.sketch = new Sketch();

    this.sketchLoop = function () {};
    
    if ($routeParams.sketchId) {
      var url = 'https://riftsketch.firebaseio.com/sketches/' + $routeParams.sketchId;
      new Firebase(url).once(
        'value',
        function (snapshot) {
          var savedSketch = snapshot.val();
          if (savedSketch) { 
            angular.extend($scope.sketch, savedSketch);
          }
          else {
            $location.path('/');
          }
        });
    }

    $scope.minimized = false;
    $scope.toggleSize = function () {
        $scope.minimized = !$scope.minimized;
    };

    $scope.sketch.save = function () {
      var sketchId = sketches.add(angular.fromJson(angular.toJson($scope.sketch)));
      $location.path('/' + sketchId);
    };

    $scope.listSketches = function () {
      $location.path('/list');
    };

    $scope.newSketch = function () {
      $location.path('/');
    };

    // TODO: Obviously, RiftSandox and the resize event listener should not be
    // part of an angular controller.
    this.riftSandbox = new RiftSandbox(window.innerWidth, window.innerHeight);
    this.riftClient = new RiftClient(
      this.riftSandbox.setHmdRotation.bind(this.riftSandbox));
    window.addEventListener(
      'resize',
      this.riftSandbox.resize.bind(this.riftSandbox),
      false
    );
    this.riftClient.init();
    this.mainLoop();

    var that = this;
    $scope.$watch('sketch.getCode()', function (newVal, oldVal) {
      that.riftSandbox.clearScene();
      var _sketchLoop;
      $scope.error = null;
      try {
          _sketchLoop = (new Function('scene', '"use strict";\n' + newVal))(that.riftSandbox.scene);
      }
      catch (err) {
          $scope.error = err.toString();
      }
      if (_sketchLoop) {
        that.sketchLoop = _sketchLoop;
      }
    });
  };

  constr.prototype.mainLoop = function () {
    window.requestAnimationFrame( this.mainLoop.bind(this) );

    // Apply movement
    this.riftSandbox.setBaseRotation();
    this.riftSandbox.updateCameraRotation();

    try {
      this.sketchLoop();
    }
    catch (err) {
      if (this.scope.error === null) {
        this.scope.error = err.toString();
        if (!this.scope.$$phase) { this.scope.$apply(); }
      }
    }

    this.riftSandbox.render();
  };

  return constr;
}());

SketchController.$inject = ['$scope', '$routeParams', 'angularFireCollection', '$location'];

var ListController = function ($scope, angularFire, $location) {
  $scope.sketchData = {};
  $scope.sketches = [];
  angularFire('https://riftsketch.firebaseio.com/sketches', $scope, 'sketchData', {});
  $scope.watch('sketchData', function (name, oldVal, newVal) {
    $scope.sketches = Object.keys(newVal).map(function (key) {
      return {sketchId: key, sketch: newVal[key]};
    });
  });
  $scope.getSketchUrl = function (sketchId) {
    return $location.absUrl().split('#')[0] + '#/' + sketchId;
  };
};

index.config(function ($routeProvider) {
  $routeProvider.
    when('/list', {templateUrl: 'list.html', controller: ListController}).
    when('/', {templateUrl: 'view.html', controller: SketchController}).
    when('/:sketchId', {templateUrl: 'view.html', controller: SketchController});
});
