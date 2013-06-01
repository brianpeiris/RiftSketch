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
    var sketches = angularFireCollection('https://riftsketch.firebaseio.com/sketches');
    $scope.sketch = new Sketch();
    
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

    $scope.sketch.save = function () {
      var sketchId = sketches.add(angular.fromJson(angular.toJson($scope.sketch)));
      $location.path('/' + sketchId);
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
      (new Function('scene', newVal))(that.riftSandbox.scene);
    });
  };

  constr.prototype.mainLoop = function () {
    window.requestAnimationFrame( this.mainLoop.bind(this) );

    // Apply movement
    this.riftSandbox.setBaseRotation();
    this.riftSandbox.updateCameraRotation();

    try {
      //codeLoop();
    }
    catch (err) {
      console.log(err);
      if (codeErr !== err) {
        this.editor.setError(err);
        codeError = err;
      }
    }

    this.riftSandbox.render();
  };

  return constr;
}());

SketchController.$inject = ['$scope', '$routeParams', 'angularFireCollection', '$location'];

index.config(function ($routeProvider) {
  $routeProvider.
    when('/', {templateUrl: 'view.html', controller: SketchController}).
    when('/:sketchId', {templateUrl: 'view.html', controller: SketchController});
});
