import {vec3, vec4, mat4} from 'gl-matrix';
import Turtle from './Turtle';

let axiom: string;
let iterations: number;
let turtle: Turtle;
let expansionRules : Map<string, string>;
let expansionFuncs : Map<string, any>;
let drawRules : Map<string, any>;

//Instanced arrays to give to GPU
//0: Cube
let transform1Arrays : number[][];
let transform2Arrays : number[][];
let transform3Arrays : number[][];
let transform4Arrays : number[][];
let colorsArrays : number[][];
let nums : number[];

function draw(i: number) {
    let t : mat4 = turtle.getTransform();

    transform1Arrays[i].push(t[0]);
    transform1Arrays[i].push(t[1]);
    transform1Arrays[i].push(t[2]);
    transform1Arrays[i].push(t[3]);

    transform2Arrays[i].push(t[4]);
    transform2Arrays[i].push(t[5]);
    transform2Arrays[i].push(t[6]);
    transform2Arrays[i].push(t[7]);

    transform3Arrays[i].push(t[8]);
    transform3Arrays[i].push(t[9]);
    transform3Arrays[i].push(t[10]);
    transform3Arrays[i].push(t[11]);

    transform4Arrays[i].push(t[12]);
    transform4Arrays[i].push(t[13]);
    transform4Arrays[i].push(t[14]);
    transform4Arrays[i].push(t[15]);

    colorsArrays[i].push(turtle.color[0]);
    colorsArrays[i].push(turtle.color[1]);
    colorsArrays[i].push(turtle.color[2]);
    colorsArrays[i].push(turtle.color[3]);
    
    nums[i]++;
}

class Box {
    size: vec3;

    constructor(size: vec3) {
        this.size = size;
    }

    setSize(x: number, y: number, z: number) {
        this.size = vec3.fromValues(x, y, z);
    }

    repeatX(incr: number, fn: (offset: number, width: number) => void) {
        for(let curr = incr; curr <= this.size[0]; curr += incr) {
            //Offset is centered
            let offset = curr - this.size[0] / 2;
            offset -= incr / 2;
            fn(offset, incr);
        }
    }

    createBuffered(offset: number, width: number) {
        let xTemp = turtle.position[0];
        turtle.position[0] += offset;
        turtle.scale[0] = width - 2;
        this.create();
        turtle.position[0] = xTemp;
    }

    create() {
        draw(0);
    }
}

class LSystem {
    box: Box;
    //Parameters for rules
    params: number[] = [];
    charParam: string = '';

    constructor(ax: string, i: number) {
        axiom = ax;
        iterations = i;
        turtle = new Turtle(vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0), 
                            vec3.fromValues(1, 0, 0), vec3.fromValues(0, 0, -1));
        expansionRules = new Map();
        expansionFuncs = new Map();
        drawRules = new Map();
        transform1Arrays = [];
        transform2Arrays = [];
        transform3Arrays = [];
        transform4Arrays = [];
        colorsArrays = [];
        nums = [0, 0, 0, 0];
        for(let i = 0; i < 4; i++) {
            transform1Arrays[i] = [];
            transform2Arrays[i] = [];
            transform3Arrays[i] = [];
            transform4Arrays[i] = [];
            colorsArrays[i] = [];
        }

        //Set expansions and rules
        drawRules.set('t', this.box.repeatX.bind(this.box));
    }

    expand(lsystem: string, iterations: number) {
        let temp : string;
        for(let i = 0; i < iterations; i++) {
            temp = '';
            for(let j = 0; j < lsystem.length; j++) {
                let c = lsystem.charAt(j);
                let func = expansionFuncs.get(c);
                if(func) {
                    //Call expansion function with any set parameters and reset parameters
                    if(this.params.length == 0) {
                        temp += func();
                    } else if(this.params.length == 1) {
                        temp += func(this.params[0]);
                    } else if(this.params.length == 2) {
                        temp += func(this.params[0], this.params[1]);
                    } else if(this.params.length == 3) {
                        temp += func(this.params[0], this.params[1], this.params[2]);
                    } else if(this.params.length == 4) {
                        temp += func(this.params[0], this.params[1], this.params[2], this.params[3]);
                    } else if(this.charParam.length > 0) {
                        temp += func(this.charParam);
                    }
                    this.params = [];
                    this.charParam = '';
                } else if(c == 'p') {
                    //Signals parameters to pass into next expansion rule
                    let parsingParameters = false;
                    do {
                        //Parse parameters
                        let num = '';
                        if(j + 1 < lsystem.length && isNaN(parseInt(lsystem.charAt(j + 1), 10))) {
                            //Not a digit so the parameter is a character
                            this.charParam += lsystem.charAt(++j);
                        } else {
                            //Is a digit, parse all consecutive digits
                            for(let digit = true; digit; digit = (j + 1 < lsystem.length && 
                                                                  !isNaN(parseInt(lsystem.charAt(j + 1), 10)) )) {
                                num += lsystem.charAt(++j);
                            }
                        }
                        //If parsed a number, add it to parameter array
                        if(num.length != 0) {
                            this.params.push(parseInt(num), 10);
                        }
                        //Check if there are more parameters to parse
                        if(j + 1 < lsystem.length && lsystem.charAt(j + 1) == 'p') {
                            parsingParameters = true;
                        }
                    } while(parsingParameters);
                } else {
                    let exp = expansionRules.get(c);
                    if(exp) {
                        temp += exp;
                    } else {
                        temp += c;
                    }
                }
            }
            lsystem = temp;
            console.log(lsystem);
        }
        return lsystem;
    }

    process(lsystem: string) {
        let history = [];
        for(let i = 0; i < lsystem.length; i++) {
            let c: string = lsystem.charAt(i);
            if(c == '[') {
                let save: Turtle = new Turtle(vec3.create(), vec3.create(), vec3.create(), vec3.create());
                save.copy(turtle);
                history.push(save);
                turtle.incr();
            } else if(c == ']') {
                turtle.copy(history.pop());
            } else if(c == 'q') {
                //Signals parameters to pass into next function call
                let parsingParameters = false;
                do {                    
                    //Parse parameters
                    let num = '';
                    for(let digit = true; digit; digit = (i + 1 < lsystem.length && 
                                                          !isNaN(parseInt(lsystem.charAt(i + 1), 10)))) {
                        num += lsystem.charAt(++i);
                    }
                    //If parsed a number, add it to parameter array
                    if(num.length != 0) {
                        this.params.push(parseInt(num), 10);
                    }
                    //Check if there are more parameters to parse
                    if(i + 1 < lsystem.length && lsystem.charAt(i + 1) == 'q') {
                        parsingParameters = true;
                    }
                } while(parsingParameters);
            } else {
                let func = drawRules.get(c);
                if(func) {
                    //Call function with any set parameters and reset parameters
                    if(this.params.length == 0) {
                        func();
                    } else if(this.params.length == 1) {
                        func(this.params[0]);
                    } else if(this.params.length == 2) {
                        func(this.params[0], this.params[1]);
                    } else if(this.params.length == 3) {
                        func(this.params[0], this.params[1], this.params[2]);
                    } else if(this.params.length == 4) {
                        func(this.params[0], this.params[1], this.params[2], this.params[3]);
                    }
                    this.params = [];
                }
            }
        }
    }

    traverse() {
        transform1Arrays = [];
        transform2Arrays = [];
        transform3Arrays = [];
        transform4Arrays = [];
        colorsArrays = [];
        nums = [0, 0, 0, 0];
        //Expand and process lsystem
        let lsystem: string = axiom;
        lsystem = this.expand(lsystem, iterations);
        this.process(lsystem);
    }

    getTransform1Arrays() {
        return transform1Arrays;
    }

    getTransform2Arrays() {
        return transform2Arrays;
    }

    getTransform3Arrays() {
        return transform3Arrays;
    }

    getTransform4Arrays() {
        return transform4Arrays;
    }

    getColorsArrays() {
        return colorsArrays;
    }

    getNums() {
        return nums;
    }
};

export default LSystem;