import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Camera from './Camera';
import {setGL, readTextFile} from './globals';
import {vec3} from 'gl-matrix';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import Mesh from './geometry/Mesh';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import PlantSystem from './PlantSystem';
import {Rule, ExpRule, FnRule, System} from './System';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  // iterations: 30,
  // size: 20,
  // rotation: 5

};
let gui: DAT.GUI;

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;

//Iteration depth / Expansion index
let system: System;

let cube: Mesh;
let meshes: Mesh[] = [];

let plantSystem: PlantSystem;
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

  let obj0: string = readTextFile('./cube.obj');
  cube = new Mesh(obj0, vec3.fromValues(0, 0, 0));
  cube.create();
  meshes.push(cube);

  system = new System();
  system.setup();
  system.expand(4);
  system.process();

  let transforms1 = system.getTransform1Arrays();
  let transforms2 = system.getTransform2Arrays();
  let transforms3 = system.getTransform3Arrays();
  let transforms4 = system.getTransform4Arrays();
  let colors = system.getColorsArrays();
  for(let i = 0; i < meshes.length; i++) {
    let t1 = new Float32Array(transforms1[i]);
    let t2 = new Float32Array(transforms2[i]);
    let t3 = new Float32Array(transforms3[i]);
    let t4 = new Float32Array(transforms4[i]);
    let c = new Float32Array(colors[i]);
    meshes[i].setInstanceVBOs(t1, t2, t3, t4, c);
    meshes[i].setNumInstances(system.getNums()[i]);
  }

  /*let obj1: string = readTextFile('./cylinder.obj');
  cylinder = new Mesh(obj1, vec3.fromValues(0, 0, 0));
  cylinder.create();
  let obj2: string = readTextFile('./person.obj');
  person = new Mesh(obj2, vec3.fromValues(0, 0, 0));
  person.create();
  plantSystem = new PlantSystem("TF", 30, 20, 20, 5);
  plantSystem.traverse();

  let transform1: Float32Array = new Float32Array(plantSystem.transform1Array);
  let transform2: Float32Array = new Float32Array(plantSystem.transform2Array);
  let transform3: Float32Array = new Float32Array(plantSystem.transform3Array);
  let transform4: Float32Array = new Float32Array(plantSystem.transform4Array);
  let color: Float32Array = new Float32Array(plantSystem.colorsArray);
  cylinder.setInstanceVBOs(transform1, transform2, transform3, transform4, color);
  cylinder.setNumInstances(plantSystem.cylinders);

  let transform1p: Float32Array = new Float32Array(plantSystem.transform1pArray);
  let transform2p: Float32Array = new Float32Array(plantSystem.transform2pArray);
  let transform3p: Float32Array = new Float32Array(plantSystem.transform3pArray);
  let transform4p: Float32Array = new Float32Array(plantSystem.transform4pArray);
  let colorp: Float32Array = new Float32Array(plantSystem.colorspArray);
  person.setInstanceVBOs(transform1p, transform2p, transform3p, transform4p, colorp);
  person.setNumInstances(plantSystem.persons);*/

  let obj3: string = readTextFile('./plane.obj');
  plane = new Mesh(obj3, vec3.fromValues(0, 0, 0));
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
}

function ctrlChanged(rule: Rule, paramNum: number) {
  let target = function(): void {
    let controller: DAT.GUIController = <DAT.GUIController> this;
    let newValue = controller.getValue();
    //curr is the iteration we want to go back to
    let curr: Rule[] = system.expHistory[rule.depth];
    //remove all following iterations from our history
    system.expHistory.length = rule.depth + 1;
    system.current = curr;

    rule.changeParam(paramNum - 1, newValue);

    system.clear();
    system.expand(4);
    system.process();

    let transforms1 = system.getTransform1Arrays();
    let transforms2 = system.getTransform2Arrays();
    let transforms3 = system.getTransform3Arrays();
    let transforms4 = system.getTransform4Arrays();
    let colors = system.getColorsArrays();
    for(let i = 0; i < meshes.length; i++) {
      let t1 = new Float32Array(transforms1[i]);
      let t2 = new Float32Array(transforms2[i]);
      let t3 = new Float32Array(transforms3[i]);
      let t4 = new Float32Array(transforms4[i]);
      let c = new Float32Array(colors[i]);
      meshes[i].setInstanceVBOs(t1, t2, t3, t4, c);
      meshes[i].setNumInstances(system.getNums()[i]);
    }

    gui.destroy();
    gui = new DAT.GUI();
    setGUI(system.axiom, gui);
  };
  return target;
}

function setGUI(rule: Rule, gui: DAT.GUI) {
  if(rule.params.length == 0) {
    let text = {name: rule.s}
    gui.add(text, 'name');
  } else {
    //Expansion rule
    let guiFolder = gui.addFolder(rule.s);

    if(rule.params.length == 1) {
      let text = {prop1: rule.params[0]}
      let ctrl1 = guiFolder.add(text, 'prop1');
      ctrl1.name(rule.paramNames[0]);
      ctrl1.onFinishChange(ctrlChanged(rule, 1));
    } else if(rule.params.length == 2) {
      let text = {prop1: rule.params[0],
                  prop2: rule.params[1]}
      let ctrl1 = guiFolder.add(text, 'prop1');
      let ctrl2 = guiFolder.add(text, 'prop2');
      ctrl1.name(rule.paramNames[0]);
      ctrl2.name(rule.paramNames[1]);
      ctrl1.onFinishChange(ctrlChanged(rule, 1));
      ctrl2.onFinishChange(ctrlChanged(rule, 2));
    } else if(rule.params.length == 3) {
      let text = {prop1: rule.params[0],
                  prop2: rule.params[1],
                  prop3: rule.params[2]}
      let ctrl1 = guiFolder.add(text, 'prop1');
      let ctrl2 = guiFolder.add(text, 'prop2');
      let ctrl3 = guiFolder.add(text, 'prop3');
      ctrl1.name(rule.paramNames[0]);
      ctrl2.name(rule.paramNames[1]);
      ctrl3.name(rule.paramNames[2]);
      ctrl1.onFinishChange(ctrlChanged(rule, 1));
      ctrl2.onFinishChange(ctrlChanged(rule, 2));
      ctrl3.onFinishChange(ctrlChanged(rule, 3));
    } else if(rule.params.length == 4) {
      let text = {prop1: rule.params[0],
                  prop2: rule.params[1],
                  prop3: rule.params[2],
                  prop4: rule.params[3]}
      let ctrl1 = guiFolder.add(text, 'prop1');
      let ctrl2 = guiFolder.add(text, 'prop2');
      let ctrl3 = guiFolder.add(text, 'prop3');
      let ctrl4 = guiFolder.add(text, 'prop4');
      ctrl1.name(rule.paramNames[0]);
      ctrl2.name(rule.paramNames[1]);
      ctrl3.name(rule.paramNames[2]);
      ctrl4.name(rule.paramNames[3]);
      ctrl1.onFinishChange(ctrlChanged(rule, 1));
      ctrl2.onFinishChange(ctrlChanged(rule, 2));
      ctrl3.onFinishChange(ctrlChanged(rule, 3));
      ctrl4.onFinishChange(ctrlChanged(rule, 4));
    }

    if(rule instanceof ExpRule) {
      let guiExpFolder = guiFolder.addFolder(rule.s + " expansion");
      let children = rule.children;
      for(let i = 0; i < children.length; i++) {
        setGUI(children[i], guiExpFolder);
      }
    }
  }
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
  gui = new DAT.GUI();
  // gui.add(controls, 'iterations', 0, 35);
  // gui.add(controls, 'size', 10, 30);
  // gui.add(controls, 'rotation', 0, 10);

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

  setGUI(system.axiom, gui);

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
    /*if(controls.iterations != iterations || 
      controls.rotation != rotation || controls.size != size) {
      iterations = controls.iterations;
      rotation = controls.rotation;
      size = controls.size;
      
      plantSystem = new PlantSystem("TF", iterations, size, size, rotation);
      plantSystem.traverse();

      let transform1: Float32Array = new Float32Array(plantSystem.transform1Array);
      let transform2: Float32Array = new Float32Array(plantSystem.transform2Array);
      let transform3: Float32Array = new Float32Array(plantSystem.transform3Array);
      let transform4: Float32Array = new Float32Array(plantSystem.transform4Array);
      let color: Float32Array = new Float32Array(plantSystem.colorsArray);
      cylinder.setInstanceVBOs(transform1, transform2, transform3, transform4, color);
      cylinder.setNumInstances(plantSystem.cylinders);

      let transform1p: Float32Array = new Float32Array(plantSystem.transform1pArray);
      let transform2p: Float32Array = new Float32Array(plantSystem.transform2pArray);
      let transform3p: Float32Array = new Float32Array(plantSystem.transform3pArray);
      let transform4p: Float32Array = new Float32Array(plantSystem.transform4pArray);
      let colorp: Float32Array = new Float32Array(plantSystem.colorspArray);
      person.setInstanceVBOs(transform1p, transform2p, transform3p, transform4p, colorp);
      person.setNumInstances(plantSystem.persons);
      }*/
    renderer.clear();
    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [
      cube, square, plane
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
