import {vec3, vec4, mat4} from 'gl-matrix';
import PlantTurtle from './PlantTurtle';

class PlantSystem {
    axiom: string;
    iterations: number;
    turtle: PlantTurtle;
    expansionRules : Map<string, string>;
    expansionFuncs : Map<string, any>;
    drawRules : Map<string, any>;
    //Instanced arrays to give to GPU
    transform1Array : number[];
    transform2Array : number[];
    transform3Array : number[];
    transform4Array : number[];
    colorsArray : number[];
    cylinders : number;
    
    transform1pArray : number[];
    transform2pArray : number[];
    transform3pArray : number[];
    transform4pArray : number[];
    colorspArray : number[];
    persons : number;

    w : number;
    h : number;

    flower : number;
    trunk : number;
    width : number;

    constructor(ax: string, i: number, width: number, height: number, rotation: number) {
        this.axiom = ax;
        this.iterations = i;
        this.turtle = new PlantTurtle(vec3.fromValues(0, 0, 0), 
            vec3.fromValues(0, 1, 0), vec3.fromValues(1, 0, 0), vec3.fromValues(0, 0, -1), rotation);
        this.expansionRules = new Map();
        this.expansionFuncs = new Map();
        this.drawRules = new Map();
        this.transform1Array = [];
        this.transform2Array = [];
        this.transform3Array = [];
        this.transform4Array = [];
        this.colorsArray = [];
        this.transform1pArray = [];
        this.transform2pArray = [];
        this.transform3pArray = [];
        this.transform4pArray = [];
        this.colorspArray = [];
        this.cylinders = 0;
        this.persons = 0;
        this.w = width;
        this.h = height;
        this.flower = 0;
        this.trunk = 0;
        this.width = 0;
        
        //CYLINDER: radius = 0.25, length = 1
        //Flower
        this.expansionRules.set('F', 'gfgfgfgfx[P][,P][,,P][,,,P][,,,,P][,,,,,P][,,,,,,P][,,,,,,,P][,,,,,,,,P][,,,,,,,,,P]' + 
            '[,,,,,,,,,,P][,,,,,,,,,,,P][,,,,,,,,,,,,P][.P][..P][...P][....P][.....P][......P][.......P][........P]' +
            '[.........P][..........P][...........P]');
        this.expansionRules.set('P', '[S]++[S]+++C');
        //Petal
        this.expansionRules.set('C', 'gfcC');
        //Spike
        this.expansionRules.set('S', 'qlllg');

        //Trunk
        this.expansionRules.set('T', 'WgfgfgfgfG');
        this.expansionRules.set('W', 'tW');
        this.expansionRules.set('G', 'nBgfG');
        //Branches
        function branch() {
            if(Math.random() < 0.6) {
                return '[bE]~';
            }
            return '';
        }
        this.expansionFuncs.set('B', branch);
        this.expansionRules.set('E', '@mgfp@mgfp@mgfp@mZgfpE')
        //Branch off of branch
        function branchLess() {
            if(Math.random() < 0.6) {
                return '[zE]~';
            }
            return '';
        }
        this.expansionFuncs.set('Z', branchLess);

        //Actions
        this.drawRules.set('f', this.turtle.moveForward.bind(this.turtle));
        this.drawRules.set('b', this.turtle.branch.bind(this.turtle));
        this.drawRules.set('z', this.turtle.branchLess.bind(this.turtle));
        //Basic rotations
        this.drawRules.set('+', this.turtle.rotateUp.bind(this.turtle));
        this.drawRules.set('-', this.turtle.rotateDown.bind(this.turtle));
        this.drawRules.set('<', this.turtle.rotateLeft.bind(this.turtle));
        this.drawRules.set('>', this.turtle.rotateRight.bind(this.turtle));
        this.drawRules.set(',', this.turtle.spinLeft.bind(this.turtle));
        this.drawRules.set('.', this.turtle.spinRight.bind(this.turtle));
        //Scaling
        this.drawRules.set('l', this.turtle.longer.bind(this.turtle));
        this.drawRules.set('t', this.turtle.thicker.bind(this.turtle));
        this.drawRules.set('n', this.turtle.thinner.bind(this.turtle));
        this.drawRules.set('m', this.turtle.thinnner.bind(this.turtle));
        //Custom rotations
        this.drawRules.set('~', this.turtle.randDir.bind(this.turtle));
        this.drawRules.set('@', this.turtle.branchRotate.bind(this.turtle));
        this.drawRules.set('c', this.turtle.petalCurve.bind(this.turtle));
        //Drawing
        this.drawRules.set('x', this.turtle.petalColor.bind(this.turtle));
        this.drawRules.set('q', this.turtle.seedColor.bind(this.turtle));
        this.drawRules.set('g', this.drawCylinder.bind(this));
        this.drawRules.set('p', this.drawPerson.bind(this));
    }

    expand(lsystem: string, iterations: number) {
        let temp : string;
        for(let i = 0; i < iterations; i++) {
            temp = '';
            for(let j = 0; j < lsystem.length; j++) {
                let c: string = lsystem.charAt(j);
                let func = this.expansionFuncs.get(c);
                if(func) {
                    temp += func();
                } else {
                    let exp: string = this.expansionRules.get(c);
                    if(exp) {
                        if(c == 'C') {
                            this.flower++;
                            if(this.flower < 50) {
                                temp += exp;
                            }
                        } else if(c == 'G') {
                            this.trunk++;
                            if(this.trunk < this.h) {
                                temp += exp;
                            }
                        } else if(c == 'W') {
                            this.width++;
                            if(this.width < this.w) {
                                temp += exp;
                            }
                        } else {
                            temp += exp;
                        }
                    } else {
                        if(c == ']') {
                            this.flower = 0;
                        }
                        temp += c;
                    }
                }
            }
            lsystem = temp;
        }
        console.log(lsystem);
        return lsystem;
    }

    process(lsystem: string) {
        let history = [];
        for(let i = 0; i < lsystem.length; i++) {
            let c: string = lsystem.charAt(i);
            if(c == '[') {
                let save = new PlantTurtle(vec3.create(), vec3.create(), vec3.create(), vec3.create(), 0);
                save.copy(this.turtle);
                history.push(save);
                this.turtle.incr();
            } else if(c == ']') {
                this.turtle.copy(history.pop());
            } else {
                //Checking for termination
                if(this.turtle.scale[0] > 0.01 && this.turtle.depth < 15) {
                    let func = this.drawRules.get(c);
                    if(func) {
                        func();
                    }
                }
            }
        }
    }

    traverse() {
        this.transform1Array = [];
        this.transform2Array = [];
        this.transform3Array = [];
        this.transform4Array = [];
        this.colorsArray = [];
        //Expand and process lsystem
        let lsystem: string = this.axiom;
        lsystem = this.expand(lsystem, this.iterations);
        this.process(lsystem);
    }

    drawCylinder() {
        let t : mat4 = this.turtle.getTransform();

        this.transform1Array.push(t[0]);
        this.transform1Array.push(t[1]);
        this.transform1Array.push(t[2]);
        this.transform1Array.push(t[3]);

        this.transform2Array.push(t[4]);
        this.transform2Array.push(t[5]);
        this.transform2Array.push(t[6]);
        this.transform2Array.push(t[7]);

        this.transform3Array.push(t[8]);
        this.transform3Array.push(t[9]);
        this.transform3Array.push(t[10]);
        this.transform3Array.push(t[11]);

        this.transform4Array.push(t[12]);
        this.transform4Array.push(t[13]);
        this.transform4Array.push(t[14]);
        this.transform4Array.push(t[15]);

        this.colorsArray.push(this.turtle.color[0]);
        this.colorsArray.push(this.turtle.color[1]);
        this.colorsArray.push(this.turtle.color[2]);
        this.colorsArray.push(this.turtle.color[3]);
        
        this.cylinders++;
    }

    drawPerson() {
        if(this.turtle.scale[0] > 0.05 || this.turtle.scale[0] < 0) {
            return;
        }
        let t : mat4 = this.turtle.getTransform();

        this.transform1pArray.push(1);
        this.transform1pArray.push(0);
        this.transform1pArray.push(0);
        this.transform1pArray.push(0);

        this.transform2pArray.push(0);
        this.transform2pArray.push(1);
        this.transform2pArray.push(0);
        this.transform2pArray.push(0);

        this.transform3pArray.push(0);
        this.transform3pArray.push(0);
        this.transform3pArray.push(1);
        this.transform3pArray.push(0);

        this.transform4pArray.push(t[12]);
        this.transform4pArray.push(t[13]);
        this.transform4pArray.push(t[14]);
        this.transform4pArray.push(t[15]);

        this.colorspArray.push(this.turtle.color[0] * 2);
        this.colorspArray.push(this.turtle.color[1] * 2);
        this.colorspArray.push(this.turtle.color[2] * 2);
        this.colorspArray.push(this.turtle.color[3]);
        
        this.persons++;
    }
};

export default PlantSystem;