/**
 * @class PathRecognizer
 */

import React, {Component, Fragment} from 'react'
import PropTypes from 'prop-types'

export class PathRecognizerModel {
  constructor(directions, datas, filter = null) {
    this.directions = directions
    this.datas = datas
    this.filter = filter
  }
}

export default class PathRecognizer extends Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
    sliceCount: PropTypes.number,
    deltaMove: PropTypes.number,
    costMax: PropTypes.number,
    models: PropTypes.array,
    onStartDraw: PropTypes.func,
    onMovePath: PropTypes.func,
    onStopDraw: PropTypes.func,
    onGesture: PropTypes.func
  }

  static defaultProps = {
    sliceCount: 8,
    deltaMove: 8,
    costMax: 32,
    models: [],
    onStartDraw: null,
    onMovePath: null,
    onStopDraw: null,
    onGesture: null
  }

  state = {
    moveTarget: null,
    points: []
  }

  handleDown = (e) => {
    this.setState({
      moveTarget: e.currentTarget,
      points: [{x:e.clientX, y:e.clientY}]
    }, () => {
      window.document.addEventListener("mouseup", this.handleUp)
      this.startRecording()
    })
  }

  handleUp = () => {
    window.document.removeEventListener("mouseup", this.handleUp)
    this.stopRecording()
  }

  handleMove = (e) => {
    this.setState({
      points: [...this.state.points, {x: e.clientX, y: e.clientY}]
    }, () => {
      if (this.props.onMovePath){
        this.props.onMovePath(this.state.points)
      }
    })
  }

  startRecording = () => {
    this.state.moveTarget.addEventListener("mousemove", this.handleMove)
    if (this.props.onStartDraw)this.props.onStartDraw()
  }

  stopRecording = () => {
    this.state.moveTarget.removeEventListener("mousemove", this.handleMove)
    if (this.props.onStopDraw)this.props.onStopDraw()
    if (this.state.points.length >= 2) {
      this.analyze()
    } else {
      if (this.props.onGesture){
        this.props.onGesture(null)
      }
    }
  }

  analyze = () => {
    let {deltaMove, sliceCount, costMax} = this.props
    let path = new Path(this.state.points, deltaMove)
    let recognizer = new PathRecognizerCore(sliceCount, deltaMove, costMax, path)
    let model = recognizer.recognize(this.props.models)

    if (model) {
      if (this.props.onGesture){
        this.props.onGesture(model.datas)
      } else {
        this.props.onGesture(null)
      }
    }

  }

  render() {
    return React.cloneElement(this.props.children, {
      onMouseDown: this.handleDown,
      onMouseUp: this.handleUp
    })
  }
}


class PathRecognizerCore {
  constructor(sliceCount, deltaMove, costMax, path) {
    this.sliceCount = sliceCount
    this.deltMove = deltaMove
    this.costMax = costMax
    this.path = path

    this.directions = this.computeDirections()
  }

  recognize(models) {
    let bestCost = Number.POSITIVE_INFINITY
    let bestModel = null

    for (let model of models) {
      let cost = this.costLeven(model.directions, this.directions)

      if (model.filter !== null){
        let pathInfos = new PathInfos(this.path.deltaPoints, this.path.boundingBox, this.directions, cost)
        cost = model.filter(pathInfos, model)
      }

      if (cost < this.costMax && cost < bestCost){
        bestCost = cost
        bestModel = model
      }
    }
    return bestModel
  }

  directionCost(a, b) {
    let dif = Math.abs(a - b)
    if (dif > this.sliceCount / 2) {
      dif = this.sliceCount - dif
    }
    return dif
  }

  create2dArray(w, h, value) {
    let result = []
    for (let x = 0; x < w; x++) {
      result.push([])
      for (let y = 0; y < h; y++) {
        result[x].push(value)
      }
    }
    return result
  }

  costLeven(a, b) {
    let td = this.create2dArray(a.length + 1, b.length + 1, 0)
    let tw = this.create2dArray(a.length + 1, b.length + 1, 0)


    let safe_max_value = Number.POSITIVE_INFINITY

    for (let x = 1; x <= a.length; x++) {
      for (let y = 1; y < b.length; y++) {
        td[x][y] = this.directionCost(a[x - 1], b[y - 1])
      }
    }

    for (let index = 1; index <= b.length; index++) {
      tw[0][index] = safe_max_value
    }

    for (let index = 1; index <= a.length; index++) {
      tw[index][0] = safe_max_value
    }

    tw[0][0] = 0

    let cost = 0
    let pa, pb, pc


    for (let x = 1; x <= a.length; x++) {
      for (let y = 1; y < b.length; y++) {
        cost = td[x][y]
        pa = tw[x - 1][y] + cost
        pb = tw[x][y - 1] + cost
        pc = tw[x - 1][y - 1] + cost
        tw[x][y] = Math.min(Math.min(pa, pb), pc)

      }
    }
    return tw[a.length][b.length - 1]
  }

  computeDirections() {
    let dpoints = this.path.deltaPoints

    if (dpoints.count < 2) {
      return []
    }

    let result = []
    let sliceAngle = Math.PI * 2.0 / this.sliceCount


    for (let i = 0; i < dpoints.length - 1; i++) {
      let angle = dpoints[i].angleWithPoint(dpoints[i + 1])
      if (angle < 0) {
        angle += Math.PI * 2
      }
      if (angle < sliceAngle / 2 || angle > Math.PI * 2 - sliceAngle) {
        result.push(0)
      } else {
        let rounded = Math.round(angle / sliceAngle)
        result.push(rounded)
      }
    }
    return result
  }
}

class PathInfos {
  constructor(deltaPoints, boundingBox, directions, cost){
    this.deltaPoints = deltaPoints
    this.boundingBox = boundingBox
    this.directions = directions
    this.cost = cost
  }
}

class Path {
  constructor(rawPoints, deltaMove) {
    this.points = []

    let pi = Number.POSITIVE_INFINITY

    this.boundingBox = new PathRect(pi, pi, -pi, -pi)
    let lastPoint = new PathPoint(rawPoints[0].x, rawPoints[0].y)
    let currentPoint = null
    this.deltaPoints = [lastPoint]

    for (let point of rawPoints) {
      currentPoint = new PathPoint(point.x, point.y)
      this.points.push(currentPoint)

      // Bounding
      if (point.x < this.boundingBox.left) this.boundingBox.left = point.x
      if (point.x > this.boundingBox.right) this.boundingBox.right = point.x
      if (point.y < this.boundingBox.top) this.boundingBox.top = point.y
      if (point.y > this.boundingBox.bottom) this.boundingBox.bottom = point.y

      // Delta
      let distance = lastPoint.squareDistanceTo(currentPoint)
      if (distance >= deltaMove * deltaMove) {
        this.deltaPoints.push(currentPoint)
        lastPoint = currentPoint
      }
    }

    if (lastPoint !== currentPoint) {
      this.deltaPoints.push(currentPoint)
    }
  }

  get count() {
    return this.points.length
  }
}

class PathRect {
  constructor(top = 0, left = 0, bottom = 0, right = 0) {
    this.top = top
    this.left = left
    this.bottom = bottom
    this.right = right
  }

  get height(){
    return this.bottom - this.top
  }

  get width(){
    return this.right - this.left
  }
}

class PathPoint {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  squareDistanceTo(point) {
    let dfx = point.x - this.x
    let dfy = point.y - this.y
    let squareDistance = dfx * dfx + dfy * dfy
    return squareDistance
  }

  angleWithPoint(point) {
    let dfx = point.x - this.x
    let dfy = point.y - this.y
    return Math.atan2(dfy, dfx)
  }
}
