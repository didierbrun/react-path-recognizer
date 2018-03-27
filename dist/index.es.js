import React, { Component } from 'react';
import PropTypes from 'prop-types';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};



















var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/**
 * @class PathRecognizer
 */

var PathRecognizerModel = function PathRecognizerModel(directions, datas) {
  var filter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  classCallCheck(this, PathRecognizerModel);

  this.directions = directions;
  this.datas = datas;
  this.filter = filter;
};

var PathRecognizer = function (_Component) {
  inherits(PathRecognizer, _Component);

  function PathRecognizer() {
    var _ref;

    var _temp, _this, _ret;

    classCallCheck(this, PathRecognizer);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = possibleConstructorReturn(this, (_ref = PathRecognizer.__proto__ || Object.getPrototypeOf(PathRecognizer)).call.apply(_ref, [this].concat(args))), _this), _this.state = {
      moveTarget: null,
      points: []
    }, _this.handleDown = function (e) {
      _this.setState({
        moveTarget: e.currentTarget,
        points: [{ x: e.clientX, y: e.clientY }]
      }, function () {
        window.document.addEventListener("mouseup", _this.handleUp);
        _this.startRecording();
      });
    }, _this.handleUp = function () {
      window.document.removeEventListener("mouseup", _this.handleUp);
      _this.stopRecording();
    }, _this.handleMove = function (e) {
      _this.setState({
        points: [].concat(toConsumableArray(_this.state.points), [{ x: e.clientX, y: e.clientY }])
      }, function () {
        if (_this.props.onMovePath) {
          _this.props.onMovePath(_this.state.points);
        }
      });
    }, _this.startRecording = function () {
      _this.state.moveTarget.addEventListener("mousemove", _this.handleMove);
      if (_this.props.onStartDraw) _this.props.onStartDraw();
    }, _this.stopRecording = function () {
      _this.state.moveTarget.removeEventListener("mousemove", _this.handleMove);
      if (_this.props.onStopDraw) _this.props.onStopDraw();
      if (_this.state.points.length >= 2) {
        _this.analyze();
      } else {
        if (_this.props.onGesture) {
          _this.props.onGesture(null);
        }
      }
    }, _this.analyze = function () {
      var _this$props = _this.props,
          deltaMove = _this$props.deltaMove,
          sliceCount = _this$props.sliceCount,
          costMax = _this$props.costMax;

      var path = new Path(_this.state.points, deltaMove);
      var recognizer = new PathRecognizerCore(sliceCount, deltaMove, costMax, path);
      var model = recognizer.recognize(_this.props.models);

      if (model) {
        if (_this.props.onGesture) {
          _this.props.onGesture(model.datas);
        } else {
          _this.props.onGesture(null);
        }
      }
    }, _temp), possibleConstructorReturn(_this, _ret);
  }

  createClass(PathRecognizer, [{
    key: 'render',
    value: function render() {
      return React.cloneElement(this.props.children, {
        onMouseDown: this.handleDown,
        onMouseUp: this.handleUp
      });
    }
  }]);
  return PathRecognizer;
}(Component);

PathRecognizer.propTypes = {
  children: PropTypes.node.isRequired,
  sliceCount: PropTypes.number,
  deltaMove: PropTypes.number,
  costMax: PropTypes.number,
  models: PropTypes.array,
  onStartDraw: PropTypes.func,
  onMovePath: PropTypes.func,
  onStopDraw: PropTypes.func,
  onGesture: PropTypes.func
};
PathRecognizer.defaultProps = {
  sliceCount: 8,
  deltaMove: 8,
  costMax: 32,
  models: [],
  onStartDraw: null,
  onMovePath: null,
  onStopDraw: null,
  onGesture: null
};
var PathRecognizerCore = function () {
  function PathRecognizerCore(sliceCount, deltaMove, costMax, path) {
    classCallCheck(this, PathRecognizerCore);

    this.sliceCount = sliceCount;
    this.deltMove = deltaMove;
    this.costMax = costMax;
    this.path = path;

    this.directions = this.computeDirections();
  }

  createClass(PathRecognizerCore, [{
    key: 'recognize',
    value: function recognize(models) {
      var bestCost = Number.POSITIVE_INFINITY;
      var bestModel = null;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = models[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var model = _step.value;

          var cost = this.costLeven(model.directions, this.directions);

          if (model.filter !== null) {
            var pathInfos = new PathInfos(this.path.deltaPoints, this.path.boundingBox, this.directions, cost);
            cost = model.filter(pathInfos, model);
          }

          if (cost < this.costMax && cost < bestCost) {
            bestCost = cost;
            bestModel = model;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return bestModel;
    }
  }, {
    key: 'directionCost',
    value: function directionCost(a, b) {
      var dif = Math.abs(a - b);
      if (dif > this.sliceCount / 2) {
        dif = this.sliceCount - dif;
      }
      return dif;
    }
  }, {
    key: 'create2dArray',
    value: function create2dArray(w, h, value) {
      var result = [];
      for (var x = 0; x < w; x++) {
        result.push([]);
        for (var y = 0; y < h; y++) {
          result[x].push(value);
        }
      }
      return result;
    }
  }, {
    key: 'costLeven',
    value: function costLeven(a, b) {
      var td = this.create2dArray(a.length + 1, b.length + 1, 0);
      var tw = this.create2dArray(a.length + 1, b.length + 1, 0);

      var safe_max_value = Number.POSITIVE_INFINITY;

      for (var x = 1; x <= a.length; x++) {
        for (var y = 1; y < b.length; y++) {
          td[x][y] = this.directionCost(a[x - 1], b[y - 1]);
        }
      }

      for (var index = 1; index <= b.length; index++) {
        tw[0][index] = safe_max_value;
      }

      for (var _index = 1; _index <= a.length; _index++) {
        tw[_index][0] = safe_max_value;
      }

      tw[0][0] = 0;

      var cost = 0;
      var pa = void 0,
          pb = void 0,
          pc = void 0;

      for (var _x2 = 1; _x2 <= a.length; _x2++) {
        for (var _y = 1; _y < b.length; _y++) {
          cost = td[_x2][_y];
          pa = tw[_x2 - 1][_y] + cost;
          pb = tw[_x2][_y - 1] + cost;
          pc = tw[_x2 - 1][_y - 1] + cost;
          tw[_x2][_y] = Math.min(Math.min(pa, pb), pc);
        }
      }
      return tw[a.length][b.length - 1];
    }
  }, {
    key: 'computeDirections',
    value: function computeDirections() {
      var dpoints = this.path.deltaPoints;

      if (dpoints.count < 2) {
        return [];
      }

      var result = [];
      var sliceAngle = Math.PI * 2.0 / this.sliceCount;

      for (var i = 0; i < dpoints.length - 1; i++) {
        var angle = dpoints[i].angleWithPoint(dpoints[i + 1]);
        if (angle < 0) {
          angle += Math.PI * 2;
        }
        if (angle < sliceAngle / 2 || angle > Math.PI * 2 - sliceAngle) {
          result.push(0);
        } else {
          var rounded = Math.round(angle / sliceAngle);
          result.push(rounded);
        }
      }
      return result;
    }
  }]);
  return PathRecognizerCore;
}();

var PathInfos = function PathInfos(deltaPoints, boundingBox, directions, cost) {
  classCallCheck(this, PathInfos);

  this.deltaPoints = deltaPoints;
  this.boundingBox = boundingBox;
  this.directions = directions;
  this.cost = cost;
};

var Path = function () {
  function Path(rawPoints, deltaMove) {
    classCallCheck(this, Path);

    this.points = [];

    var pi = Number.POSITIVE_INFINITY;

    this.boundingBox = new PathRect(pi, pi, -pi, -pi);
    var lastPoint = new PathPoint(rawPoints[0].x, rawPoints[0].y);
    var currentPoint = null;
    this.deltaPoints = [lastPoint];

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = rawPoints[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var point = _step2.value;

        currentPoint = new PathPoint(point.x, point.y);
        this.points.push(currentPoint);

        // Bounding
        if (point.x < this.boundingBox.left) this.boundingBox.left = point.x;
        if (point.x > this.boundingBox.right) this.boundingBox.right = point.x;
        if (point.y < this.boundingBox.top) this.boundingBox.top = point.y;
        if (point.y > this.boundingBox.bottom) this.boundingBox.bottom = point.y;

        // Delta
        var distance = lastPoint.squareDistanceTo(currentPoint);
        if (distance >= deltaMove * deltaMove) {
          this.deltaPoints.push(currentPoint);
          lastPoint = currentPoint;
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    if (lastPoint !== currentPoint) {
      this.deltaPoints.push(currentPoint);
    }
  }

  createClass(Path, [{
    key: 'count',
    get: function get$$1() {
      return this.points.length;
    }
  }]);
  return Path;
}();

var PathRect = function () {
  function PathRect() {
    var top = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var left = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var bottom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var right = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    classCallCheck(this, PathRect);

    this.top = top;
    this.left = left;
    this.bottom = bottom;
    this.right = right;
  }

  createClass(PathRect, [{
    key: 'height',
    get: function get$$1() {
      return this.bottom - this.top;
    }
  }, {
    key: 'width',
    get: function get$$1() {
      return this.right - this.left;
    }
  }]);
  return PathRect;
}();

var PathPoint = function () {
  function PathPoint(x, y) {
    classCallCheck(this, PathPoint);

    this.x = x;
    this.y = y;
  }

  createClass(PathPoint, [{
    key: 'squareDistanceTo',
    value: function squareDistanceTo(point) {
      var dfx = point.x - this.x;
      var dfy = point.y - this.y;
      var squareDistance = dfx * dfx + dfy * dfy;
      return squareDistance;
    }
  }, {
    key: 'angleWithPoint',
    value: function angleWithPoint(point) {
      var dfx = point.x - this.x;
      var dfy = point.y - this.y;
      return Math.atan2(dfy, dfx);
    }
  }]);
  return PathPoint;
}();

export { PathRecognizerModel };
export default PathRecognizer;
