// this allows RequireJS without necessitating it.
// see http://bob.yexley.net/umd-javascript-that-runs-anywhere/
(function (root, factory) {

  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else {
    root.LeapDataPlotter = factory();
  }

}(this, function () {

  var LeapDataPlotter, TimeSeries;

  var colors = ['#900', '#090', '#009', '#990', '#909', '#099'];
  var colorIndex = 0;

  LeapDataPlotter = function (options) {
    this.options = options || (options = {});
    this.seriesHash = {};
    this.series = [];
    this.init(options.el);
  }

  LeapDataPlotter.prototype.init = function(el) {

    if (el){
      var canvas = el;
    }else {
      var canvas = document.createElement('canvas');
      canvas.className = "leap-data-plotter";
      document.body.appendChild(canvas);
    }


    this.canvas = canvas;
    this.context = canvas.getContext('2d');

    this.rescale();
  }

  // this method must be called any time the canvas changes size.
  LeapDataPlotter.prototype.rescale = function(){
    var styles = getComputedStyle(this.canvas);
    var windowWidth = parseInt(styles.width, 10);
    var windowHeight = parseInt(styles.height, 10);
    this.width = windowWidth;
    this.height = windowHeight;

    var devicePixelRatio = window.devicePixelRatio || 1;
    var backingStoreRatio = this.context.webkitBackingStorePixelRatio ||
                            this.context.mozBackingStorePixelRatio ||
                            this.context.msBackingStorePixelRatio ||
                            this.context.oBackingStorePixelRatio ||
                            this.context.backingStorePixelRatio || 1;

    var ratio = devicePixelRatio / backingStoreRatio;
    if (devicePixelRatio !== backingStoreRatio) {

      var oldWidth = this.canvas.width;
      var oldHeight = this.canvas.height;

      this.canvas.width = oldWidth * ratio;
      this.canvas.height = oldHeight * ratio;

      this.canvas.style.width = oldWidth + 'px';
      this.canvas.style.height = oldHeight + 'px';

      this.context.scale(ratio, ratio);
    }

    this.clear();
    this.draw();
  }

  // pushes a data point on to the plot
  // data can either be a number
  // or an array [x,y,z], which will be plotted in three graphs.
  // options:
  // - y: the graph index on which to plot this datapoint
  // - color: hex code
  // - name: name of the plot
  // - precision: how many decimals to show (for max, min, current value)
  LeapDataPlotter.prototype.plot = function (id, data, opts) {
//    console.assert(!isNaN(data), "No plotting data received");

    opts || (opts = {});

    if (data.length) {

      for (var i = 0, c = 120; i < data.length; i++, c=++c>122?97:c) {
        this.getTimeSeries( id + '.' + String.fromCharCode(c), opts )
          .push( data[i], {pointColor: opts.pointColor} );
      }

    } else {

      this.getTimeSeries(id, opts)
        .push(data, {pointColor: opts.pointColor});

    }

  }

  LeapDataPlotter.prototype.getTimeSeries = function (id, opts) {
    var ts = this.seriesHash[id];

    if (!ts) {

      var defaultOpts = this.getOptions(id);
      for (key in opts){
        defaultOpts[key] = opts[key];
      }

      ts = new TimeSeries(defaultOpts);
      this.series.push(ts);
      this.seriesHash[id] = ts;

    }

    return ts;
  }

  LeapDataPlotter.prototype.getOptions = function (name) {
    var c = colorIndex;
    colorIndex = (colorIndex + 1) % colors.length;
    var len = this.series.length;
    var y = len ? this.series[len - 1].y + 50 : 0;
    return {
      y: y,
      width: this.width,
      color: colors[c],
      name: name
    }
  }

  LeapDataPlotter.prototype.clear = function() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  LeapDataPlotter.prototype.draw = function() {
    var context = this.context;
    this.series.forEach(function (s) {
      s.draw(context);
    });
  }

  LeapDataPlotter.prototype.update = function(){
    this.clear();
    this.draw();
  }

  TimeSeries = function (opts) {
    opts = opts || {};
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.precision = opts.precision || 5;
    this.units = opts.units || '';
    this.width = opts.width || 1000;
    this.height = opts.height || 50;
    this.length = opts.length || 600;
    this.color = opts.color || '#000';
    this.name = opts.name || "";
    this.frameHandler = opts.frameHandler;

    this.max = -Infinity;
    this.min = Infinity;
    this.data = [];
    this.pointColors = [];
  }

  TimeSeries.prototype.push = function (value, opts) {
    this.data.push(value);

    if (this.data.length >= this.length) {
      this.data.shift();
    }

    if (opts && opts.pointColor){
      this.pointColors.push(opts.pointColor);

      // note: this can get out of sync if a point color is not set for every point.
      if (this.pointColors.length >= this.length) {
        this.pointColors.shift();
      }
    }

    return this;
  }

  TimeSeries.prototype.draw = function (context) {
    var self = this;
    var xScale =  (this.width - 10) / (this.length - 1);
    var yScale = -(this.height - 10) / (this.max - this.min);

    var padding = 5;
    var top = (this.max - this.min) * yScale + 10;

    context.save();
    context.strokeRect(this.x, this.y, this.width, this.height);
    context.translate(this.x, this.y + this.height - padding);
    context.strokeStyle = this.color;

    context.beginPath();

    var max = -Infinity;
    var min = Infinity;
    this.data.forEach(function (d, i) {
      if (d > max) max = d;
      if (d < min) min = d;

      if (isNaN(d)) {
        context.stroke();
        context.beginPath();
      } else {
        context.lineTo(i * xScale, (d - self.min) * yScale);
        if (self.pointColors[i] && (self.pointColors[i] != self.pointColors[i - 1]) ){
          context.stroke();
          context.strokeStyle = self.pointColors[i];
          context.beginPath();
          context.lineTo(i * xScale, (d - self.min) * yScale);
        }
      }
    });
    context.stroke();

    // draw labels
    context.fillText( this.name, padding,  top);
    context.fillText( this.data[this.data.length - 1].toPrecision(this.precision) + this.units, padding, 0 );

    context.textAlign="end";
    context.fillText( this.min.toPrecision(this.precision) + this.units, this.width - padding, 0 );
    context.fillText( this.max.toPrecision(this.precision) + this.units, this.width - padding, top );
    context.textAlign="left";
    // end draw labels

    context.restore();
    this.min = min;
    this.max = max;
  }

  return LeapDataPlotter;

}));
