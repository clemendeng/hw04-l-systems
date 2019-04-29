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
  color: vec4 = vec4.fromValues(0.5, 1, 0.5, 1);
  scale: vec3 = vec3.fromValues(1, 1, 1);
  depth: number = 0;
  branchAngle: number = 0;

  constructor(pos: vec3, orient: vec3, right: vec3, up: vec3) {
    this.position = pos;
    this.orientation = orient;
    this.right = right;
    this.up = up;
  }

  clone() {
    let t = new Turtle(vec3.create(), vec3.create(), vec3.create(), vec3.create());
    t.copy(this);
    return t;
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
    return this;
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