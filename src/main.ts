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
  load: 0,
  iterations: 15,
  delete: function(){}
};
let gui: DAT.GUI;

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;

//Iteration depth / Expansion index
let system: System;
let selected: Rule;
let selectedGUI: DAT.GUI;
let selectControllers: DAT.GUIController[];

let cube: Mesh;
let meshes: Mesh[] = [];

let plantSystem: PlantSystem;
let cylinder: Mesh;
let person: Mesh;
let plane: Mesh;

let iterations: number = 15;
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

  let obj1: string = readTextFile('./cylinder.obj');
  cylinder = new Mesh(obj1, vec3.fromValues(0, 0, 0));
  cylinder.create();
  meshes.push(cylinder);

  let obj2: string = readTextFile('./person.obj');
  person = new Mesh(obj2, vec3.fromValues(0, 0, 0));
  person.create();
  meshes.push(person);

  system = new System();
  system.setup(2);
  system.clear();
  system.expand(controls.iterations);
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
  
  /*plantSystem = new PlantSystem("TF", 30, 20, 20, 5);
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
    if(paramNum == 0) {
      //Name change
      rule.s = newValue;
    } else {
      //Parameter change
      rule.changeParam(paramNum - 1, newValue);
      system.updateChangedParam(rule);
      system.clear();
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
    }

    gui.destroy();
    gui = new DAT.GUI();
    initSelected(gui);
    setGUIArray(system.axiom, gui);
    let func = selectFn(selected, selectedGUI);
    func();
  };
  return target;
}

function initSelected(gui: DAT.GUI) {
  let loadFunc = gui.add(controls, "load", {Building: 1, Plant: 2});
  loadFunc.onFinishChange(loadFn);
  let iterationsFunc = gui.add(controls, "iterations");
  iterationsFunc.onFinishChange(iterationsFn);

  selectControllers = [];
  let guiFolder = gui.addFolder("Selected");
  let text = {name: "", prop1: 0.01, prop2: 0.01, prop3: 0.01, prop4: 0.01}
  selectControllers.push(guiFolder.add(text, 'name'));
  selectControllers.push(guiFolder.add(text, 'prop1'));
  selectControllers.push(guiFolder.add(text, 'prop2'));
  selectControllers.push(guiFolder.add(text, 'prop3'));
  selectControllers.push(guiFolder.add(text, 'prop4'));
  for(let i = 1; i < selectControllers.length; i++) {
    selectControllers[i].step(0.01);
  }
  guiFolder.add(controls, 'delete');
  guiFolder.open();
}

function selectFn(rule: Rule, folder: DAT.GUI) {
  let target = function(): void {
    selected = rule;
    selectedGUI = folder;
    //Setting name controller
    selectControllers[0].setValue(rule.s);
    selectControllers[0].onFinishChange(ctrlChanged(rule, 0));
    //Setting parameter controllers
    for(let i = 1; i <= 4; i++) {
      if(rule.params.length >= i) {
        selectControllers[i].name(rule.paramNames[i - 1]);
        selectControllers[i].step(0.01);
        selectControllers[i].setValue(rule.params[i - 1]);
        selectControllers[i].onFinishChange(ctrlChanged(rule, i));
      } else {
        selectControllers[i].name('-');
        selectControllers[i].setValue(0);
      }
    }
    controls.delete = deleteFn(rule);
  };
  return target;
}

function loadFn() {
  let controller: DAT.GUIController = <DAT.GUIController> this;
  let newValue = controller.getValue();
  if(newValue == 1) {
    controls.iterations = 2;
  } else if(newValue == 2) {
    controls.iterations = 15;
  }
  system.setup(newValue);
  system.clear();
  system.expand(controls.iterations);
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

  controls.load = 0;
  gui.destroy();
  gui = new DAT.GUI();
  initSelected(gui);
  setGUIArray(system.axiom, gui);
}

function iterationsFn() {
  system.clear();
  if(controls.iterations < system.currDepth) {
    system.current = system.expHistory[controls.iterations];
    system.currDepth = controls.iterations;
  } else if(controls.iterations > system.currDepth) {
    system.expand(controls.iterations - system.currDepth);
  }
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
  initSelected(gui);
  setGUIArray(system.axiom, gui);
}

function deleteFn(rule: Rule) {
  let target = function(): void {
    //Parameter change
    //curr is the iteration we want to go back to
    let curr: Rule[] = system.expHistory[rule.depth];
    let expand = system.expHistory.length - rule.depth;
    //remove all following iterations from our history
    system.expHistory.length = rule.depth + 1;
    system.current = curr;
    system.current.splice(rule.index, 1);

    system.clear();
    system.expand(expand);
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
    initSelected(gui);
    if(system.expHistory[0].length != 0) {
      setGUIArray(system.axiom, gui);
    }
  };
  return target;
}

function setGUIArray(rules: Rule[], gui: DAT.GUI) {
  for(let i = 0; i < rules.length; i++) {
    setGUI(rules[i], gui);
  }
}

function setGUI(rule: Rule, gui: DAT.GUI) {
  if((rule.exp && rule.children.length > 0) || rule.params.length > 0) {
    //For functions with parameters
    let guiFolder = gui.addFolder(rule.s);
    let button = {select: selectFn(rule, guiFolder)};
    guiFolder.add(button, 'select');
    if(rule.exp && rule.children.length > 0) {
      let guiExpFolder = guiFolder.addFolder(rule.s + " expansion");
      let children = rule.children;
      for(let i = 0; i < children.length; i++) {
        setGUI(children[i], guiExpFolder);
      }
    }
  } else {
    let text = {name: rule.s}
    gui.add(text, 'name');
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
  initSelected(gui);
  setGUIArray(system.axiom, gui);

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
      cube, cylinder, person, square, plane
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
