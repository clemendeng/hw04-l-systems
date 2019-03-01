import { vec3, vec4, quat, mat4 } from 'gl-matrix';

// Converts from degrees to radians.
function radians(degrees : number) {
  return degrees * Math.PI / 180;
};

class Turtle {
  position: vec3 = vec3.create();
  orientation: vec3 = vec3.create();
  right: vec3 = vec3.create();
  up: vec3 = vec3.create();
  color: vec4 = vec4.create();
  scale: vec3 = vec3.fromValues(1, 1, 1);
  depth: number = 0;
  branchAngle: number = 0;
  curveAngle: number;

  constructor(pos: vec3, orient: vec3, right: vec3, up: vec3, rotation: number) {
    this.position = pos;
    this.orientation = orient;
    this.right = right;
    this.up = up; 
    this.color = vec4.fromValues(0.1, 0.1, 0.1, 1);
    this.curveAngle = rotation * 3 / 10;
  }

  copy(t : Turtle) {
    this.position = vec3.clone(t.position);
    this.orientation = vec3.clone(t.orientation);
    this.right = vec3.clone(t.right);
    this.up = vec3.clone(t.up);
    this.color = vec4.clone(t.color);
    this.scale = vec3.clone(t.scale);
    this.depth = t.depth;
    this.branchAngle = t.branchAngle;
    this.curveAngle = t.curveAngle;
    return this;
  }

  petalCurve() {
    let perp : vec3 = vec3.fromValues(this.orientation[0], 0, this.orientation[2]);
    vec3.normalize(perp, perp);
    let up : vec3 = vec3.fromValues(0, 1, 0);
    let target : vec3 = vec3.create();
    vec3.add(target, vec3.scale(perp, perp, 0.3), vec3.scale(up, up, 0.7));
    vec3.normalize(target, target);
    let q: quat = quat.create();
    quat.rotationTo(q, this.orientation, target);
    let axis : vec3 = vec3.create();
    let angle : number = quat.getAxisAngle(axis, q);
    quat.setAxisAngle(q, axis, angle * this.orientation[1] / 10);
    quat.normalize(q, q);
    vec3.transformQuat(this.orientation, this.orientation, q);
    vec3.normalize(this.orientation, this.orientation);
    vec3.transformQuat(this.up, this.up, q);
    vec3.normalize(this.up, this.up);
    this.scale[0] = this.scale[0] - 0.3;
    this.scale[2] = this.scale[2] - 0.3;
    vec4.subtract(this.color, this.color, vec4.fromValues(0.04, 0.05, 0.05, 0));
  }

  petalColor() {
    this.color = vec4.fromValues(1, 1, 1, 1);
  }

  seedColor() {
    this.color = vec4.fromValues(78/255, 1/255, 1/255, 1);
  }

  longer() {
    this.scale[1] = this.scale[1] + 0.5;
  }

  thicker() {
    this.scale[0] = this.scale[0] + 0.5;
    this.scale[2] = this.scale[2] + 0.5;
  }

  thinner() {
    let t : number = Math.random();
    this.scale[0] = this.scale[0] - 0.5 * t;
    this.scale[2] = this.scale[2] - 0.5 * t;
  }

  thinnner() {
    let t : number = Math.random();
    this.scale[0] = this.scale[0] - 0.2 * t;
    this.scale[2] = this.scale[2] - 0.2 * t;
  }

  randDir() {
    let t : number = Math.random() * 135;
    this.branchAngle = (this.branchAngle + 45 + t) % 360;
  }

  branch() {
    let r: quat = quat.create();
    quat.setAxisAngle(r, this.orientation, radians(this.branchAngle));
    quat.normalize(r, r);
    vec3.transformQuat(this.right, this.right, r);
    vec3.normalize(this.right, this.right);
    vec3.transformQuat(this.up, this.up, r);
    vec3.normalize(this.up, this.up);
    //Displace
    let temp : vec3 = vec3.create();
    vec3.add(this.position, this.position, vec3.scale(temp, this.up, 0.15 * this.scale[0]));
    this.scale[0] = this.scale[0] * 0.5;
    this.scale[2] = this.scale[2] * 0.5;

    let t : number = Math.random() * 30;
    let q : quat = quat.create();
    quat.setAxisAngle(q, this.right, radians(-30 - t));
    quat.normalize(q, q);
    vec3.transformQuat(this.orientation, this.orientation, q);
    vec3.normalize(this.orientation, this.orientation);
    vec3.transformQuat(this.up, this.up, q);
    vec3.normalize(this.up, this.up);
  }

  branchLess() {
    let r: quat = quat.create();
    quat.setAxisAngle(r, this.orientation, radians(this.branchAngle));
    quat.normalize(r, r);
    vec3.transformQuat(this.right, this.right, r);
    vec3.normalize(this.right, this.right);
    vec3.transformQuat(this.up, this.up, r);
    vec3.normalize(this.up, this.up);
    //Displace
    let temp : vec3 = vec3.create();
    vec3.add(this.position, this.position, vec3.scale(temp, this.up, 0.1 * this.scale[0]));
    this.scale[0] = this.scale[0] * 0.75;
    this.scale[2] = this.scale[2] * 0.75;

    let t : number = Math.random() * 15;
    let q : quat = quat.create();
    quat.setAxisAngle(q, this.right, radians(-15 - t));
    quat.normalize(q, q);
    vec3.transformQuat(this.orientation, this.orientation, q);
    vec3.normalize(this.orientation, this.orientation);
    vec3.transformQuat(this.up, this.up, q);
    vec3.normalize(this.up, this.up);
  }

  branchRotate() {
    let pos : vec3 = this.position;
    //HACK TO AVOID FLOWER: APPLIES FOR HEIGHT AND WIDTH OF 20
    if(pos[0] < 7 && pos[2] < 7 && pos[1] > 29) {
        this.scale[0] = 0;
        this.scale[2] = 0;
    }
    let q: quat = quat.create();
    quat.setAxisAngle(q, this.right, radians(-this.curveAngle));
    quat.normalize(q, q);
    vec3.transformQuat(this.orientation, this.orientation, q);
    vec3.normalize(this.orientation, this.orientation);
    vec3.transformQuat(this.up, this.up, q);
    vec3.normalize(this.up, this.up);
    
    if(this.depth % 2 == 1) {
      this.color = vec4.fromValues(0.4, 0.4, 0.4, 1);
    } else {
      this.color = vec4.fromValues(40/255, 10/255, 10/255, 1);
    }
  }

  moveForward() {
    let move: vec3 = vec3.create();
    vec3.scale(move, this.orientation, this.scale[1]);
    vec3.add(this.position, this.position, move);
  }

  rotateUp() {
    let q: quat = quat.create();
    quat.setAxisAngle(q, this.right, radians(15));
    quat.normalize(q, q);
    vec3.transformQuat(this.orientation, this.orientation, q);
    vec3.normalize(this.orientation, this.orientation);
    vec3.transformQuat(this.up, this.up, q);
    vec3.normalize(this.up, this.up);
  }

  rotateDown() {
    let q: quat = quat.create();
    quat.setAxisAngle(q, this.right, radians(-15));
    quat.normalize(q, q);
    vec3.transformQuat(this.orientation, this.orientation, q);
    vec3.normalize(this.orientation, this.orientation);
    vec3.transformQuat(this.up, this.up, q);
    vec3.normalize(this.up, this.up);
  }

  rotateLeft() {
    let q: quat = quat.create();
    quat.setAxisAngle(q, this.up, radians(-15));
    quat.normalize(q, q);
    vec3.transformQuat(this.orientation, this.orientation, q);
    vec3.normalize(this.orientation, this.orientation);
    vec3.transformQuat(this.right, this.right, q);
    vec3.normalize(this.right, this.right);
  }

  rotateRight() {
    let q: quat = quat.create();
    quat.setAxisAngle(q, this.up, radians(15));
    quat.normalize(q, q);
    vec3.transformQuat(this.orientation, this.orientation, q);
    vec3.normalize(this.orientation, this.orientation);
    vec3.transformQuat(this.right, this.right, q);
    vec3.normalize(this.right, this.right);
  }

  spinLeft() {
    let q: quat = quat.create();
    quat.setAxisAngle(q, this.orientation, radians(-15));
    quat.normalize(q, q);
    vec3.transformQuat(this.right, this.right, q);
    vec3.normalize(this.right, this.right);
    vec3.transformQuat(this.up, this.up, q);
    vec3.normalize(this.up, this.up);
  }

  spinRight() {
    let q: quat = quat.create();
    quat.setAxisAngle(q, this.orientation, radians(15));
    quat.normalize(q, q);
    vec3.transformQuat(this.right, this.right, q);
    vec3.normalize(this.right, this.right);
    vec3.transformQuat(this.up, this.up, q);
    vec3.normalize(this.up, this.up);
  }

  incr() {
    this.depth++;
  }

  getTransform() : mat4 {
    let q: quat = quat.create();
    quat.rotationTo(q, vec3.fromValues(0, 1, 0), this.orientation);
    let target : mat4 = mat4.create();
    mat4.fromRotationTranslationScale(target, q, this.position, this.scale);
    return target;
  }
};

export default Turtle;