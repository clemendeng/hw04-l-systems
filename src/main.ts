import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Lsystem from './Lsystem';
import Camera from './Camera';
import {setGL, readTextFile} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Mesh from './geometry/Mesh';
import {vec3, mat4} from 'gl-matrix';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  iterations: 30,
  size: 20,
  rotation: 5
};

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;

let lsystem: Lsystem;
let cylinder: Mesh;
let person: Mesh;
let plane: Mesh;

let iterations: number = 30;
let size: number = 20;
let rotation: number = 5;

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();

  let obj0: string = readTextFile('./cylinder.obj');
  cylinder = new Mesh(obj0, vec3.fromValues(0, 0, 0));
  cylinder.create();
  let obj1: string = readTextFile('./person.obj');
  person = new Mesh(obj1, vec3.fromValues(0, 0, 0));
  person.create();
  lsystem = new Lsystem("TF", 30, 20, 20, 5);
  lsystem.traverse();

  let transform1: Float32Array = new Float32Array(lsystem.transform1Array);
  let transform2: Float32Array = new Float32Array(lsystem.transform2Array);
  let transform3: Float32Array = new Float32Array(lsystem.transform3Array);
  let transform4: Float32Array = new Float32Array(lsystem.transform4Array);
  let color: Float32Array = new Float32Array(lsystem.colorsArray);
  cylinder.setInstanceVBOs(transform1, transform2, transform3, transform4, color);
  cylinder.setNumInstances(lsystem.cylinders);

  let transform1p: Float32Array = new Float32Array(lsystem.transform1pArray);
  let transform2p: Float32Array = new Float32Array(lsystem.transform2pArray);
  let transform3p: Float32Array = new Float32Array(lsystem.transform3pArray);
  let transform4p: Float32Array = new Float32Array(lsystem.transform4pArray);
  let colorp: Float32Array = new Float32Array(lsystem.colorspArray);
  person.setInstanceVBOs(transform1p, transform2p, transform3p, transform4p, colorp);
  person.setNumInstances(lsystem.persons);

  let obj2: string = readTextFile('./plane.obj');
  plane = new Mesh(obj2, vec3.fromValues(0, 0, 0));
  plane.create();
  let a1 = [1, 0, 0, 0];
  let a2 = [0, 1, 0, 0];
  let a3 = [0, 0, 1, 0];
  let a4 = [0, 0, 0, 1];
  let cc = [0.2, 0.2, 0.2, 1];
  let t1: Float32Array = new Float32Array(a1);
  let t2: Float32Array = new Float32Array(a2);
  let t3: Float32Array = new Float32Array(a3);
  let t4: Float32Array = new Float32Array(a4);
  let c: Float32Array = new Float32Array(cc);
  plane.setInstanceVBOs(t1, t2, t3, t4, c);
  plane.setNumInstances(1);

  // Set up instanced rendering data arrays here.
  // This example creates a set of positional
  // offsets and gradiated colors for a 100x100 grid
  // of squares, even though the VBO data for just
  // one square is actually passed to the GPU
  let offsetsArray = [];
  let colorsArray = [];
  let n: number = 100.0;
  for(let i = 0; i < n; i++) {
    for(let j = 0; j < n; j++) {
      offsetsArray.push(i);
      offsetsArray.push(j);
      offsetsArray.push(0);

      colorsArray.push(i / n);
      colorsArray.push(j / n);
      colorsArray.push(1.0);
      colorsArray.push(1.0); // Alpha channel
    }
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(n * n); // grid of "particles"
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'iterations', 0, 35);
  gui.add(controls, 'size', 10, 30);
  gui.add(controls, 'rotation', 0, 10);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 35, 60), vec3.fromValues(0, 15, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    if(controls.iterations != iterations || 
      controls.rotation != rotation || controls.size != size) {
      iterations = controls.iterations;
      rotation = controls.rotation;
      size = controls.size;
      
      lsystem = new Lsystem("TF", iterations, size, size, rotation);
      lsystem.traverse();

      let transform1: Float32Array = new Float32Array(lsystem.transform1Array);
      let transform2: Float32Array = new Float32Array(lsystem.transform2Array);
      let transform3: Float32Array = new Float32Array(lsystem.transform3Array);
      let transform4: Float32Array = new Float32Array(lsystem.transform4Array);
      let color: Float32Array = new Float32Array(lsystem.colorsArray);
      cylinder.setInstanceVBOs(transform1, transform2, transform3, transform4, color);
      cylinder.setNumInstances(lsystem.cylinders);

      let transform1p: Float32Array = new Float32Array(lsystem.transform1pArray);
      let transform2p: Float32Array = new Float32Array(lsystem.transform2pArray);
      let transform3p: Float32Array = new Float32Array(lsystem.transform3pArray);
      let transform4p: Float32Array = new Float32Array(lsystem.transform4pArray);
      let colorp: Float32Array = new Float32Array(lsystem.colorspArray);
      person.setInstanceVBOs(transform1p, transform2p, transform3p, transform4p, colorp);
      person.setNumInstances(lsystem.persons);
    }
    renderer.clear();
    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [
      square, cylinder, person, plane
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
