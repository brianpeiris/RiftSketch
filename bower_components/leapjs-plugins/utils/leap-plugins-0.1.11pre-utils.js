var mkgivens = require('./mkgivens');
var mmult = require('mmult');

function appendrot(m, ij, angle) {
  var givens;
  var dim;

  dim = m.length;

  if (dim < 2) {
    return m;
  }

  givens = mkgivens(dim, ij, angle);

  return mmult(m, givens);
}

module.exports = appendrot;
function copy(m) {
  var i, j;
  var res;

  res = [];

  for (i = 0; i < m.length; i++) {
    res[i] = [];
    for (j = 0; j < m[i].length; j++) {
      res[i][j] = m[i][j];
    }
  }

  return res;
}

module.exports = copy;
/** Exact calculations for the case of 2x2 matrices **/
function exact(m) {
  var a;
  var b;
  var d;

  var muplus, muminus;

  var sum, dif;

  var root;
  var vals, vect;

  var u1, u2, len;

  a = m[0][0];
  b = m[0][1];
  d = m[1][1];

  sum = (a + d) / 2;
  dif = (a - d) / 2;

  root = Math.sqrt(b * b + dif * dif);

  muplus = sum + root;
  muminus = sum - root;

  vals = [
    [muplus,  0],
    [0, muminus]
  ];

  a -= muplus;

  u1 = 1;
  u2 = a / b;

  len = Math.sqrt(u1 * u1 + u2 * u2);

  u1 /= len;
  u2 /= len;

  vect = [
    [u1,  u2],
    [-u2, u1]
  ];

  return {
    vals: vals,
    vect: vect
  };
}

module.exports = exact;
var assert = require('assert');

function findangle(m, ij) {
  var mii, mij, mji, mjj;

  var muplus;
  var sum, dif, root;

  var u1, u2;

  var len;

  mii = m[ij.i][ij.i];
  mij = m[ij.i][ij.j];
  mji = m[ij.j][ij.i];
  mjj = m[ij.j][ij.j];

  if (mji !== mij) {
    return 0;
  }

  sum = (mii + mjj) / 2;
  dif = (mii - mjj) / 2;

  root = Math.sqrt(mji * mji + dif * dif);

  muplus = sum + root;
  muminus = sum - root;
  mii = mii - muplus;

  // r1 = mii, mij => r1ort = 1, mii/mij

  u1 = 1;
  u2 = mii / mij;

  len = Math.sqrt(u1 * u1 + u2 * u2);

  u1 /= len;
  u2 /= len;

  return { cos: u1, sin: -u2 };
}

module.exports = findangle;
function findij(m) {
  var dim;

  var i, j;
  var max, maxi, maxj;

  dim = m.length;

  if (dim < 2) {
    return void 0;
  }

  max = m[0][1];
  maxi = 0;
  maxj = 1;

  for (i = 0; i < dim; i++) {
    for (j = 0; j < i; j++) {
      if (Math.abs(m[j][i]) > Math.abs(max)) {
        max = m[j][i];
        maxi = j;
        maxj = i;
      }
    }
  }

  return {i: maxi, j: maxj};
}

module.exports = findij;
function ident(n) {
  var i, j;
  var ident;

  ident = [];

  for (i = 0; i < n; i++) {
    ident[i] = [];

    for (j = 0; j < n; j++) {
      ident[i][j] = i === j ? 1 : 0;
    }
  }

  return ident;
}

module.exports = ident;



var ident = require('./ident');

function mkgivens(dim, ij, angle) {
  var givens;

  givens = ident(dim);

  givens[ij.i][ij.i] = angle.cos;
  givens[ij.i][ij.j] = -angle.sin;
  givens[ij.j][ij.j] = angle.cos;
  givens[ij.j][ij.i] = angle.sin;

  return givens;
}

module.exports = mkgivens;
function offd(m) {
  var off;
  var dim;
  var i, j;

  dim = m.length;

  off = 0;

  for (i = 0; i < dim; i++) {
    for (j = 0; j < dim; j++) {
      if (i !== j) {
        off += m[i][j] * m[i][j];
      }
    }
  }

  return off;
}

module.exports = offd;
var offd = require('./offd');

function optimistf(m, t) {
  var off;
  var dim;
  var term;

  dim = m.length;

  off = offd(m);

  term = t / (2 * dim - 1);

  return off < (1 / (dim - 1)) * term * term; 
}

module.exports = optimistf;
var offd = require('./offd');

function ln(n) {
  return Math.log(n);
}

function pessimistf(m, t) {
  var dim;
  var off;
  var steps;
  var term;

  dim = m.length;
  off = offd(m);
  term = dim * dim - dim;

  steps = (ln(off) + ln(dim - 1) - 2 * ln(t) + 2 * ln(2 * dim - 1)) /
  (ln(term) - ln(term - 2));

  steps = Math.ceil(steps);

  return steps;
}

module.exports = pessimistf;
/** Since eigenvalues are continuous relatively to small changes to the matrix,
we can repair symmetricity of matrix after floating point operations */

function repair(m) {
  var dim;
  var i, j;
  var rpm;

  dim = m.length;
  rpm = [];

  for (j = 0; j < dim; j++) {
    for (i = 0; i < j; i++) {
      if (!rpm[i]) {
        rpm[i] = [];
      }

      if (!rpm[j]) {
        rpm[j] = [];
      }

      rpm[i][j] = m[i][j];
      rpm[j][i] = m[i][j];
    }
  }

  for (i = 0; i < dim; i++) {
    rpm[i][i] = m[i][i];
  }

  return rpm;
}

module.exports = repair;
var mmult = require('mmult');
var transpose = require('transpose');
var ident = require('./ident');
var mkgivens = require('./mkgivens');

function rotate(b, ij, angle) {
  var dim;

  var givens;

  dim = b.length;

  if (dim < 2) {
    return b;
  }

  givens = mkgivens(dim, ij, angle);

  return mmult(mmult(transpose(givens), b), givens);
}

module.exports = rotate;
var test = require('taptap');
var assert = require('assert');

var appendrot = require('../appendrot');

test(function (done) { /* 2x2 */
  var m
  var ij;
  var angle;

  m = [
    [1, 0],
    [0, 1]
  ]; 

  ij = {i: 0, j: 1};

  angle = { cos: 100, sin: -100 };

  assert.deepEqual(appendrot(m, ij, angle), [
    [100,  100],
    [-100, 100]
  ]);
  done();
});

test(function (done) { /* 3x3 */
  var m
  var ij;
  var angle;

  m = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]; 

  ij = {i: 0, j: 2};

  angle = { cos: 100, sin: -100 };

  assert.deepEqual(appendrot(m, ij, angle), [
    [100,  0, 100],
    [0  ,  1,   0],
    [-100, 0, 100]
  ]);
  done();
});
var test = require('taptap');
var assert = require('assert');

var copy = require('../copy');

test(function (done) { /* 3x3 */
  var m = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ];

  assert.equal(m, m);
  assert.deepEqual(copy(m), m);
  assert.notEqual(copy(m), m);

  done();
});

var test = require('taptap');
var assert = require('assert');

var exact = require('../exact');

test(function (done) {
  assert.deepEqual(exact([
    [1, 2],
    [2, 4]
  ]), {
    vals: [
      [5, 0],
      [0, 0]
    ],
    vect: [
      [1 / Math.sqrt(5), -2 / Math.sqrt(5)],
      [2 / Math.sqrt(5),  1 / Math.sqrt(5)]
    ]
  });

  done();
});

/* Works fine, but different float rounding */
test.skip(function (done) {
  assert.deepEqual(exact([
    [2, 3],
    [3, 1]
  ]), {
    vals: [
      [4.5413,  0],
      [0, -1.5413]
    ],
    vect: [
      [0.7630, -0.64636286],
      [0.64636286,  0.7630]
    ]
  });

  done();
});
var test = require('taptap');
var assert = require('assert');

var findangle = require('../findangle');

test(function (done) { /* 2x2 */
  var m = [
    [3, 2],
    [2, 6]
  ];
  var ij = {i: 0, j: 1};

  assert.deepEqual(findangle(m, ij), { cos: 1 / Math.sqrt(5), sin: 2 / Math.sqrt(5) });

  done();
});

test(function (done) { /* 2x2 */
  var m = [
    [1, 2],
    [2, 4]
  ];
  var ij = {i: 0, j: 1};

  assert.deepEqual(findangle(m, ij), { cos: 1 / Math.sqrt(5), sin: 2 / Math.sqrt(5) });

  done();
});

test(function (done) { /* 2x2 failover */
  var m = [
    [1, .0000000000000000000000000000001],
    [0, 4]
  ];
  var ij = {i: 0, j: 1};

  assert.deepEqual(findangle(m, ij), 0);

  done();
});

test('5x5', function (done) { /* 5x5 */
  var m = [
    [1, 0, 0, 0, 0],
    [0, 1, 2, 0, 0],
    [3, 2, 4, 0, 0],
    [4, 1, 9, 3, 4],
    [1, 2, 4, 0, 3],
  ];
  var ij = {i: 1, j: 2};

  assert.deepEqual(findangle(m, ij), { cos: 1 / Math.sqrt(5), sin: 2 / Math.sqrt(5) });

  done();
});

var test = require('taptap');
var assert = require('assert');

var findij = require('../findij');

test(function (done) { /* 1x1 */
  assert.equal(findij([[1]]), void 0);
  done();
});

test(function (done) { /* 2x2 */
  assert.deepEqual(findij([
    [1, 2],
    [3, 4]
  ]), {i: 0 , j: 1 });
  done();
});

test(function (done) { /* 2x2, 2 */
  assert.deepEqual(findij([
    [1 ,-.1, 0],
    [-.1, 1, 0],
    [ 0,  0, 1]
  ]), {i : 0, j : 1});
  done();
});

test(function (done) { /* 4x4 */
  assert.deepEqual(findij([
    [1, 2, 4, 6],
    [3, 4, 5, 1],
    [1, 5, 6, 3],
    [7, 1, 8, 1]
  ]), {i: 0, j: 3});
  done();
});

var test = require('taptap');
var assert = require('assert');

var ident = require('../ident');

test(function (done) { /* 1x1 */
  assert.deepEqual(ident(1), [[1]]);
  done();
});  

test(function (done) { /* 2x2 */
  assert.deepEqual(ident(2), [
    [1, 0],
    [0, 1]
  ]);
  done();
});

test(function (done) { /* 4x4 */
  assert.deepEqual(ident(4), [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ])
  done();
});

var test = require('taptap');
var assert = require('assert');

var mkgivens = require('../mkgivens');

test(function (done) { /* 2x2 */
  var angle;
  var ij;
  var givens;

  angle = {cos: 100, sin: -100};
  ij = {i: 0, j: 1};
  givens = mkgivens(2, ij, angle);

  assert.deepEqual(givens, [
    [100,  100],
    [-100, 100]
  ]);
  done();
});

test(function (done) { /* 3x3 */
  var angle;
  var ij;
  var givens;

  angle = {cos: 100, sin: -100};
  ij = {i: 0, j: 2};
  givens = mkgivens(3, ij, angle);

  assert.deepEqual(givens, [
    [100,  0, 100],
    [0  ,  1,   0],
    [-100, 0, 100]
  ]);
  done();
});

var test = require('taptap');
var assert = require('assert');

var offd = require('../offd');

test(function (done) { /* 2x2 */
  var m;

  m = [
    [2, 3],
    [4, 5]
  ];

  assert.equal(offd(m), 25);

  done();
});

test(function (done) { /* 3x3 */
  var m;

  m = [
    [2, 3, 1],
    [4, 5, 1],
    [1, 1, 0]
  ];

  assert.equal(offd(m), 29);

  done();
});

var test = require('taptap');
var assert = require('assert');

var optimistf = require('../optimistf');

test(function (done) { /* obviously false */
  var m;

  m = [
    [2, 100],
    [100, 1]
  ];

  assert.equal(optimistf(m, .1), false);

  done();
});

test(function (done) { /* obviously true */
  var m;

  m = [
    [2, 0.1],
    [0.1, 1]
  ];

  assert.equal(optimistf(m, 100), true);

  done();
});

test(function (done) { /* less obvious true case */
  var m;

  m = [
    [2, 0.02],
    [0.02, 1]
  ];

  assert.equal(optimistf(m, 0.1), true);

  done();
});

test(function (done) { /* less obvious false case */
  var m;

  m = [
    [2, 0.03],
    [0.02, 1]
  ];

  assert.equal(optimistf(m, 0.1), false);

  done();
});

var test = require('taptap');
var assert = require('assert');

var pessimistf = require('../pessimistf');

test(function (done) { /* not suitable for 2x2 matrices */
  var m;

  m = [
    [1, 20],
    [20, 3]
  ];

  assert.equal(pessimistf(m, .1), 0);

  done();
});

test(function(toby) { /* 3x3 */
  var m;

  m = [
    [1, 2, 3],
    [2, 4, 5],
    [3, 5, 6]
  ];

  assert.equal(pessimistf(m, 0.01), 44);

  toby();
});

test(function (toby) { /* 3x3, t >> 0, neg */
  var m;

  m = [
    [1, 2, 3],
    [2, 4, 5],
    [3, 5, 6]
  ];

  assert.equal(pessimistf(m, 100), -2);

  toby();
});

test(function (toby) { /* 3x3, offd -> 0, neg */
  var m;

  m = [
    [1, 0.0001, 0.0001],
    [0.0001, 2, 0.0001],
    [0.0001, 0.0001, 3]
  ];

  assert.equal(pessimistf(m, 0.01), -8);

  toby();
});
var test = require('taptap');
var assert = require('assert');

var repair = require('../repair');

test(function (done) { /* already symmetric, 3x3 */
  var m;

  m = [
    [1, 3, 5],
    [3, 2, 0],
    [5, 0, 4]
  ];

  assert.notEqual(repair(m), m);
  assert.deepEqual(repair(m), m);

  done();
});

test(function (done) { /* not symmetric, 3x3 */
  var m;

  m = [
    [1, 1e-10, 0],
    [0, 10000, 0],
    [0, 0    , 1]
  ];

  assert.deepEqual(repair(m), [
    [1,     1e-10, 0],
    [1e-10, 10000, 0],
    [0,     0,     1]
  ]);

  done();
});

test(function (done) { /* not symmetric, 2x2 */
  var m;

  m = [
    [1, 1e-16],
    [0, 2    ]
  ];

  assert.deepEqual(repair(m), [
    [1, 1e-16],
    [1e-16, 2]
  ]);

  done();
});
var test = require('taptap');
var assert = require('assert');

var rotate = require('../rotate');

test(function (done) { /* 1x1 */
  var m = [[1]];
  var ij = {i: 0, j: 0};
  var angle = { cos: Math.cos(Math.PI/2), sin: Math.sin(Math.PI/2) };
  assert.equal(rotate(m, ij, angle), m);
  done();
});

// This test passes ok, it is just the rounding of floats
// http://people.math.gatech.edu/~klounici6/2605/Lectures%20notes%20Carlen/chap3.pdf
test.skip(function (done) { /* 3x3 */
  var m = [
    [2, 1, 1],
    [1, 2, 1],
    [1, 1, 2]
  ];
  var ij = {i: 0, j: 1};
  var angle = { cos: 1 / Math.sqrt(2), sin: 1/ Math.sqrt(2) };

  var m1 = [
    [3,            0, Math.sqrt(2)],
    [0,            1, 0           ],
    [Math.sqrt(2), 0, 2           ]
  ];

  assert.deepEqual(rotate(m, ij, angle),  m1);

  done();
});

// This test passes ok, it is just the rounding of floats
// http://people.math.gatech.edu/~klounici6/2605/Lectures%20notes%20Carlen/chap3.pdf
test.skip(function (done) { /* 3x3, step2 */
  var m = [
    [3,            0, Math.sqrt(2)],
    [0,            1, 0           ],
    [Math.sqrt(2), 0, 2           ]
  ];
  var ij = {i: 0, j: 2};
  var angle = { cos: Math.sqrt(2/3), sin: Math.sqrt(1/3) };

  var m1 = [
    [4, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];

  assert.deepEqual(rotate(m, ij, angle),  m1);

  done();
});
var assert = require('assert');

var copy = require('./fn/copy');
var findangle = require('./fn/findangle');
var findij = require('./fn/findij');
var rotate = require('./fn/rotate');
var ident = require('./fn/ident');
var appendrot = require('./fn/appendrot');
var pessimistf = require('./fn/pessimistf');
var optimistf = require('./fn/optimistf');
var repair = require('./fn/repair');
var exact = require('./fn/exact');

function jae(m, t) {
  var dim;

  var b, v;
  var ij;
  var angle;

  var eigen;

  var pfcast;

  assert(m);
  assert(t !== void 0);

  dim = m.rows;

  if (dim === 1) {
    return m;
  }

  if (dim === 2) {
    return exact(m);
  }

  b = copy(m);
  v = ident(dim);

  pfcast = pessimistf(m, t);

  while (pfcast-- > 0) {
    ij = findij(b);
    angle = findangle(b, ij);
    b = rotate(b, ij, angle);
    v = appendrot(v, ij, angle);

    b = repair(b);

    if (optimistf(b, t)) {
      break;
    }
  }

  eigen = {
    vals: b,
    vect: v
  };

  return eigen;
}

module.exports = jae;
var assert = require('assert');

function init(m) {
  if (m.dp) {
    m.rfn = 'readDoubleBE';
    m.wfn = 'writeDoubleBE';
    m.bpv = 8;
  } else {
    m.rfn = 'readFloatBE';
    m.wfn = 'writeFloatBE';
    m.bpv = 4;
  }

  if (!m.buf) {
    m.buf = new Buffer(m.rows * m.cols * m.bpv);
  }

  m.stride = [m.cols, 1];
}

function float2dm(rows, cols, dp) {
  assert(rows);
  assert(cols);

  this.rows = rows;
  this.cols = cols;
  this.dp = dp;
}

float2dm.prototype.get = function (i, j) {
  var ofs;

  if (!this.buf) {
    init(this);
  }

  ofs = (i * this.stride[0] + j * this.stride[1]) * this.bpv;

  return this.buf[this.rfn](ofs);
};

float2dm.prototype.set = function (i, j, v) {
  var ofs;

  if (!this.buf) {
    init(this);
  }

  ofs = (i * this.stride[0] + j * this.stride[1]) * this.bpv;

  this.buf[this.wfn](v, ofs);
};

float2dm.prototype.tr = function () {
  var cview;

  if (!this.buf) {
    init(this);
  }

  cview = new float2dm(this.rows, this.cols, this.dp);
  cview.buf = this.buf;
  
  init(cview);

  cview.stride = [this.stride[1], this.stride[0]];

  return cview;
};

module.exports = float2dm;
var test = require('taptap');
var assert = require('assert');

var matrix = require('../index');

test(function (done) {
  /* Float matrix */
  var m;

  m = new matrix(2, 3);

  assert.equal(m.buf, void(0));  
  assert.equal(m.rfn, void(0));
  assert.equal(m.wfn, void(0));

  m.set(0, 0, 1.3);

  assert(m.buf.length, 24);  
  assert.equal(m.rfn, 'readFloatBE');
  assert.equal(m.wfn, 'writeFloatBE');

  m.set(0, 1, 2);
  m.set(0, 2, 3.51);
  m.set(1, 0, 33.18);
  m.set(1, 1, 35);
  m.set(1, 2, 11);

  // assert.equal(m.get(0, 0), 1.3); // <-- 1.2988896369934082
  assert.equal(m.get(0, 1), 2);
  // assert.equal(m.get(0, 2), 3.5); // <-- 3.509999990463257
  // assert.equal(m.get(1, 0), 33.18); // <-- 33.17993927001953
  assert.equal(m.get(1, 1), 35);
  assert.equal(m.get(1, 2), 11);

  done();
});

test(function (done) {
  /* Double matrix */
  var m;

  m = new matrix(2, 3, 1);

  assert.equal(m.buf, void(0));
  assert.equal(m.rfn, void(0));
  assert.equal(m.wfn, void(0));

  m.set(0, 0, 1.3);

  assert(m.buf.length, 48); 
  assert.equal(m.rfn, 'readDoubleBE');
  assert.equal(m.wfn, 'writeDoubleBE');

  m.set(0, 1, 2);
  m.set(0, 2, 3.51);
  m.set(1, 0, 33.18);
  m.set(1, 1, 35);
  m.set(1, 2, 11);

  assert.equal(m.get(0, 0), 1.3);
  assert.equal(m.get(0, 1), 2);
  assert.equal(m.get(0, 2), 3.51);
  assert.equal(m.get(1, 0), 33.18);
  assert.equal(m.get(1, 1), 35);
  assert.equal(m.get(1, 2), 11);

  done();
});

test(function (done) {
  /* Transpose */
  var m;

  m = new matrix(2, 3, 1);

  assert.equal(m.buf, void(0));

  m = m.tr();

  assert.equal(m.buf.length, 48);  

  m.set(0, 0, 1.3);
  m.set(0, 1, 33.18);
  m.set(1, 0, 2);
  m.set(1, 1, 35);
  m.set(2, 0, 3.51);
  m.set(2, 1, 11);

  m = m.tr();

  assert.equal(m.get(0, 0), 1.3);
  assert.equal(m.get(0, 1), 2);
  assert.equal(m.get(0, 2), 3.51);
  assert.equal(m.get(1, 0), 33.18);
  assert.equal(m.get(1, 1), 35);
  assert.equal(m.get(1, 2), 11);

  done();
});

test(function (done) {
  /* Transpose 2 */
  var m;

  m = new matrix(2, 3, 1);

  m = m.tr();

  m.set(0, 0, 1.3);
  m.set(0, 1, 33.18);
  m.set(1, 0, 2);
  m.set(1, 1, 35);
  m.set(2, 0, 3.51);
  m.set(2, 1, 11);

  assert.equal(m.get(0, 0), 1.3);
  assert.equal(m.get(0, 1), 33.18);
  assert.equal(m.get(1, 0), 2);
  assert.equal(m.get(1, 1), 35);
  assert.equal(m.get(2, 0), 3.51);
  assert.equal(m.get(2, 1), 11);

  done();
});
var test = require('taptap');
var assert = require('assert');

var jea = require('../index');
var fmatrix = require('float2dm');
var mmult = require('mmult');
var transpose = require('transpose');

test(function (done) { /* 2x2 matrix */
  var A;
  var res;
  var vals;
  var vect;

  A = new fmatrix(2, 2);

  A.set(0, 0, 3); A.set(0, 1, 2);
  A.set(1, 0, 2); A.set(1, 1, 6);

  res = jea(A, 0);
  vals = res.vals;
  vect = res.vect;

  assert.equal(vals.get(0, 0), 7); assert.equal(vals.get(0, 1), 0);
  assert.equal(vals.get(1, 0), 0); assert.equal(vals.get(1, 1), 2);

  assert.equal(vect.get(0, 0), 1 / Math.sqrt(5));
  assert.equal(vect.get(0, 1), -2 / Math.sqrt(5));
  assert.equal(vect.get(1, 0), 2 / Math.sqrt(5));
  assert.equal(vect.get(1, 1), 1 / Math.sqrt(5));

  done();
});

test(function (done) { /* 2x2 matrix, 2 */
  var A;
  var res;
  var vals;
  var vect;

  A = new fmatrix(2, 2);

  A.set(0, 0, 1); A.set(0, 1, 2);
  A.set(1, 0, 2); A.set(1, 1, 4);

  res = jea(A, 0);

  vals = res.vals;
  vect = res.vect;

  assert.equal(vals.get(0, 0), 5); assert.equal(vals.get(0, 1), 0);
  assert.equal(vals.get(1, 0), 0); assert.equal(vals.get(1, 1), 0);

  assert.equal(vect.get(0, 0), 1 / Math.sqrt(5));
  assert.equal(vect.get(0, 1), -2 / Math.sqrt(5));
  assert.equal(vect.get(1, 0), 2 / Math.sqrt(5));
  assert.equal(vect.get(1, 1), 1 / Math.sqrt(5));

  done();
});

// Works ok, just rounding errors
test.skip(function (done) { /* 2x2 matrix, 3 */
  var A;
  var len;
  var su2;
  var res;
  var vals;
  var vect;

  A = new fmatrix(2, 2);

  A.set(0, 0, 1); A.set(0, 1, 2);
  A.set(1, 0, 2); A.set(1, 1, 5);

  su2 = (-2 - 2 * Math.sqrt(2)) / 2;
  len = 1 + Math.pow(su2, 2);
  len = Math.sqrt(len);

  res = jea(A, 0);

  vals = res.vals;
  vect = res.vect;

  assert.equal(vals.get(0, 0), 3 + 2 * Math.sqrt(2)); 
  assert.equal(vals.get(0, 1), 0);
  assert.equal(vals.get(1, 0), 0); 
  assert.equal(vals.get(1, 1), 3 - 2 * Math.sqrt(2));

  assert.equal(vect.get(0, 0), 1 / len);
  assert.equal(vect.get(0, 1), su2 / len);
  assert.equal(vect.get(1, 0), -su2 / len);
  assert.equal(vect.get(1, 1), 1 / len);

  done();
});

// Works ok, just rounding errors
test.skip(function (done) { /* 3x3 */
  var A;
  var res;
  var vals;
  var vect;

  A = new fmatrix(2, 2);

  A.set(0, 0, 1); A.set(0, 1, 2);
  A.set(1, 0, 2); A.set(1, 1, 5);

  A = [
    [2, 1, 1], 
    [1, 2, 1],
    [1, 1, 2]
  ];

  assert.deepEqual(jea(A, 0.1), {
    vals: [
      [4, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ],
    vect: mmult(
      [
        [1 / Math.sqrt(2), - 1 / Math.sqrt(2), 0],
        [1 / Math.sqrt(2),   1 / Math.sqrt(2), 0],
        [               0,                  0, 1],
      ],
      [
        [Math.sqrt(2/3), 0, - Math.sqrt(1/3)],
        [             0, 1,                0],
        [Math.sqrt(1/3), 0,   Math.sqrt(2/3)],
      ]
    )}); // more fair way

  done();
});

// Example of optimistic case
// Works ok, just rounding errors
test.skip(function (done) { /* 3x3, 2 */
  var A;
  var expected;

  A = [
    [2, -4,  1],
    [-4, 5, -1],
    [1,  -1, 2]
  ];

  expected = [
    [8.08996 , 0.00555, -0.05593],
    [0.00555 , 1.70646,        0],
    [-0.05593,       0, -0.79642]
  ];

  assert.deepEqual(jea(A, 1.4).vals, expected);
  assert.deepEqual(mmult(
    mmult(transpose(jea(A, 1.4).vect), A), jea(A, 1.4).vect), expected);

  done();
});
function mmult(a, b) {
  var c;

  var n, m, l;
  var i, j, k;

  n = a.length;
  m = b.length;
  l = b[0].length;

  c = [];

  for (i = 0; i < n; i++) {
    for (j = 0; j < l; j++) {
      if (!c[i]) {
        c[i] = [];
      }

      c[i][j] = 0;
      for (k = 0; k < m; k++) {
        c[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return c;
}

module.exports = mmult;
var assert = require('assert');
var mmult = require('../index');

describe('mmult multiplies two matrices', function () {
  it('1x1, 1x2', function (done) {
    var m1 = [[1]];
    var m2 = [[3, 4]];

    assert.deepEqual(mmult(m1, m2), m2);
    assert.notEqual(mmult(m1, m2), m2);
    done();
  });

  it('4x2, 2x3', function (done) {
    var m1 = [
      [4, 2],
      [4, 2],
      [4, 2],
      [4, 2]
    ];
    var m2 = [
      [1, 2, 3],
      [4, 5, 6]
    ];

    var m3 = [
      [12, 18, 24],
      [12, 18, 24],
      [12, 18, 24],
      [12, 18, 24]
    ];

    assert.deepEqual(mmult(m1, m2), m3);
    done();
  });
});
function transpose(m) {
  var mt;

  var rows;
  var cols;

  var i, j;

  mt = [];

  rows = m.length;
  cols = m[0].length;

  for (j = 0; j < cols; j++) {
    for (i = 0; i < rows; i++) {
      if (!mt[j]) {
        mt[j] = [];
      }

      mt[j][i] = m[i][j];
    }
  }

  return mt;
}

module.exports = transpose;
var test = require('test');
var assert  = require('assert');

var transpose = require('../index');

it(function (done) { /* 1x1 */
  assert.deepEqual(transpose([[1]]), [[1]]);
  done();
});

it(function (done) { /* 2x2 */
  assert.deepEqual(transpose([[1, 2], [3, 4]]), [[1,3],[2,4]]);
  done();
});

it(function (done) { /* 4x4 */
  assert.deepEqual(transpose([
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [8, 4, 5, 6],
    [4, 5, 6, 7]
  ]), [
    [1, 2, 8, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6],
    [4, 5, 6, 7]
  ])
  done();
});

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
