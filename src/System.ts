import {vec3, mat4, quat} from 'gl-matrix'
import {radians} from './globals';
import Turtle from './Turtle'

let turtle: Turtle = new Turtle(vec3.fromValues(0, 0, 0), 
vec3.fromValues(0, 1, 0), vec3.fromValues(1, 0, 0), vec3.fromValues(0, 0, -1));
let history: Turtle[] = [];

//Instanced arrays to give to GPU
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

export interface Rule {
    //Strings are just for gui (?)
    s: string;
    
    //Parameters are for function/expansion function
    params: number[];
    paramNames: string[];
    children?: Rule[];

    //The iteration number this rule corresponds to
    depth: number;
    index: number;

    exp?(): Rule[];
    func?(): void;

    clone?() : Rule;

    //Function to change a parameter of the rule
    changeParam(paramNum: number, newValue: number) : void;
}

export abstract class ExpRule implements Rule {
    s: string;
    sExpansion: string;
    params: number[];
    paramNames: string[];
    children: Rule[];

    depth: number;
    index: number;

    constructor(s: string, paramNames: string[], params: number[], depth: number, index: number) {
        this.s = s;
        this.paramNames = paramNames;
        this.params = params;
        this.children = [];
        this.depth = depth;
        this.index = index;
    }

    setChildren(r: Rule[]) {
        this.sExpansion = "";
        for(let i = 0; i < r.length; i++) {
            this.sExpansion += r[i].s;
        }
        this.children = r;
    }

    abstract exp(): Rule[];
    abstract changeParam(paramNum: number, newValue: number): void;
}

export abstract class FnRule implements Rule {
    s: string;
    params: number[];
    paramNames: string[];

    depth: number;
    index: number;

    constructor(s: string, paramNames: string[], params: number[], depth: number, index: number) {
        this.s = s;
        this.paramNames = paramNames;
        this.params = params;
        this.depth = depth;
        this.index = index;
    }

    abstract func(): void;
    abstract changeParam(paramNum: number, newValue: number): void;
}

class Building extends ExpRule {
    width: number;
    height: number;
    floorHeight: number;
    windowWidth: number;
    static count: number = 0;
    num: number;

    constructor(depth: number, index: number, width: number, height: number, floorHeight: number, windowWidth: number) {
        super("Building" + Building.count, 
            ["Width", "Height", "Floor Height", "Window Width"],
            [width, height, floorHeight, windowWidth], depth, index);
        this.width = width;
        this.height = height;
        this.floorHeight = floorHeight;
        this.windowWidth = windowWidth;
        this.num = Building.count++;
    }

    exp() {
        let target: Rule[] = [];

        let currHeight = 0;
        //Add floors until no room for a floor
        while(currHeight <= this.height - this.floorHeight) {
            //Create floor
            let floor = new Floor(this.depth + 1, target.length, this.width, this.floorHeight, this.windowWidth);
            target.push(floor);
            this.children.push(floor);
            //Go to next floor
            let nextFloor = new Translate(this.depth + 1, target.length, 0, this.floorHeight, 0);
            target.push(nextFloor);
            this.children.push(nextFloor);
            //Update height to check if there is room for a floor
            currHeight += this.floorHeight;
        }
        this.setChildren(target);
        return target;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.width = newValue;
        } else if(paramNum == 1) {
            this.height = newValue;
        } else if(paramNum == 2) {
            this.floorHeight = newValue;
        } else if(paramNum == 3) {
            this.windowWidth = newValue;
        }
    }
}

class Cube extends FnRule {
    x: number;
    y: number;
    z: number;
    static count: number = 0;
    num: number;

    constructor(depth: number, index: number, x: number, y: number, z: number) {
        super("cube" + Cube.count, ["x", "y", "z"], [x, y, z], depth, index);
        this.x = x;
        this.y = y;
        this.z = z;
        this.num = Cube.count++;
    }

    func() {
        turtle.scale = vec3.fromValues(this.x, this.y, this.z);
        draw(0);
    }

    clone() {
        return new Cube(this.depth, this.index, this.x, this.y, this.z);
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.x = newValue;
        } else if(paramNum == 1) {
            this.y = newValue;
        } else if(paramNum == 2) {
            this.z = newValue;
        }
    }
}

class Floor extends ExpRule {
    width: number;
    height: number;
    windowWidth: number;
    static count: number = 0;
    num: number;

    constructor(depth: number, index: number, width: number, height: number, windowWidth: number) {
        super("Floor" + Floor.count, ["Width", "Height", "Window Width"], [width, height, windowWidth], depth, index);
        this.width = width;
        this.height = height;
        this.windowWidth = windowWidth;
        this.num = Floor.count++;
    }

    exp() {
        let target: Rule[] = [];

        //The actual floor
        let cube = new Cube(this.depth + 1, target.length, this.width - 1, this.height - 0.5, this.width - 1);
        target.push(cube);

        //The windows
        target.push(new Save(this.depth + 1, target.length));

        //Face +z direction
        target.push(new Rotate(this.depth + 1, target.length, 0, -90));
        for(let i = 0; i < 4; i++) {
            target.push(new Rotate(this.depth + 1, target.length, 2, 90));
            target.push(new Save(this.depth + 1, target.length));
            target.push(new Forward(this.depth + 1, target.length, (this.width - 1) / 2));
            target.push(new Up(this.depth + 1, target.length, this.height / 2));
            target.push(new Cube(this.depth + 1, target.length, this.windowWidth, this.windowWidth, this.windowWidth));
            target.push(new Load(this.depth + 1, target.length));
        }

        target.push(new Load(this.depth + 1, target.length));
        this.setChildren(target);
        return target;
    }

    clone() {
        return new Floor(this.depth, this.index, this.width, this.height, this.windowWidth);
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.width = newValue;
        } else if(paramNum == 1) {
            this.height = newValue;
        } else if(paramNum == 2) {
            this.windowWidth = newValue;
        }
    }
}

class Rotate extends FnRule {
    axis: number;
    degrees: number;
    static count: number = 0;
    num: number;

    constructor(depth: number, index: number, axis: number, degrees: number) {
        super("rotate" + Rotate.count, ["Axis", "Degrees"], [axis, degrees], depth, index);
        this.axis = axis;
        this.degrees = degrees;
        this.num = Rotate.count++;
    }

    func() {
        if(this.axis == 0) {
            //Rotate about x axis, upwards
            let q: quat = quat.create();
            quat.setAxisAngle(q, turtle.right, radians(this.degrees));
            quat.normalize(q, q);
            vec3.transformQuat(turtle.orientation, turtle.orientation, q);
            vec3.normalize(turtle.orientation, turtle.orientation);
            vec3.transformQuat(turtle.up, turtle.up, q);
            vec3.normalize(turtle.up, turtle.up);
            vec3.scale(turtle.up, turtle.up, -1);
        } else if(this.axis == 1) {
            //Rotate about y axis, rolling to the right
            let q: quat = quat.create();
            quat.setAxisAngle(q, turtle.orientation, radians(this.degrees));
            quat.normalize(q, q);
            vec3.transformQuat(turtle.right, turtle.right, q);
            vec3.normalize(turtle.right, turtle.right);
            vec3.transformQuat(turtle.up, turtle.up, q);
            vec3.normalize(turtle.up, turtle.up);
        } else if(this.axis == 2) {
            //Rotate about z axis, left
            let q: quat = quat.create();
            quat.setAxisAngle(q, turtle.up, radians(this.degrees));
            quat.normalize(q, q);
            vec3.transformQuat(turtle.orientation, turtle.orientation, q);
            vec3.normalize(turtle.orientation, turtle.orientation);
            vec3.transformQuat(turtle.right, turtle.right, q);
            vec3.normalize(turtle.right, turtle.right);
        }
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.axis = newValue;
        } else if(paramNum == 1) {
            this.degrees = newValue;
        }
    }
}

class Forward extends FnRule {
    dist: number;
    static count: number = 0;
    num: number;

    constructor(depth: number, index: number, dist: number) {
        super("forward" + Forward.count, ["Distance"], [dist], depth, index);
        this.dist = dist;
        this.num = Forward.count++;
    }

    func() {
        vec3.add(turtle.position, turtle.position, vec3.scale(vec3.create(), turtle.orientation, this.dist));
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.dist = newValue;
        }
    }
}

class Up extends FnRule {
    dist: number;
    static count: number = 0;
    num: number;

    constructor(depth: number, index: number, dist: number) {
        super("up" + Up.count, ["Distance"], [dist], depth, index);
        this.dist = dist;
        this.num = Up.count++;
    }

    func() {
        vec3.add(turtle.position, turtle.position, vec3.scale(vec3.create(), turtle.up, this.dist));
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.dist = newValue;
        }
    }
}

class Right extends FnRule {
    dist: number;
    static count: number = 0;
    num: number;

    constructor(depth: number, index: number, dist: number) {
        super("right" + Right.count, ["Distance"], [dist], depth, index);
        this.dist = dist;
        this.num = Right.count++;
    }

    func() {
        vec3.add(turtle.position, turtle.position, vec3.scale(vec3.create(), turtle.right, this.dist));
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.dist = newValue;
        }
    }
}

class Translate extends FnRule {
    x: number;
    y: number;
    z: number;
    static count: number = 0;
    num: number;

    constructor(depth: number, index: number, x: number, y: number, z: number) {
        super("translate" + Translate.count, ["x", "y", "z"], [x, y, z], depth, index);
        this.x = x;
        this.y = y;
        this.z = z;
        this.num = Translate.count++;
    }

    func() {
        vec3.add(turtle.position, turtle.position, vec3.fromValues(this.x, this.y, this.z));
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.x = newValue;
        } else if(paramNum == 1) {
            this.y = newValue;
        } else if(paramNum == 2) {
            this.z = newValue;
        }
    }
}

class Save extends FnRule {
    constructor(depth: number, index: number) {
        super("save", [], [], depth, index);
    }

    func() {
        history.push(turtle.clone());
    }

    changeParam(paramNum: number, newValue: number) {}
}

class Load extends FnRule {
    constructor(depth: number, index: number) {
        super("load", [], [], depth, index);
    }

    func() {
        turtle = history.pop();
    }

    changeParam(paramNum: number, newValue: number) {}
}

export class System {
    axiom: Rule;
    current: Rule[];
    //Index refers to iteration number
    expHistory: Rule[][];

    constructor() {
        this.current = [];
        this.expHistory = [];
        turtle = new Turtle(vec3.fromValues(0, 0, 0), 
        vec3.fromValues(0, 1, 0), vec3.fromValues(1, 0, 0), vec3.fromValues(0, 0, -1));
        history = [];

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
    }

    setup() {
        let b = new Building(0, 0, 10, 30, 2, 1);
        this.axiom = b;
        this.current.push(b);
        this.expHistory.push([b]);
    }

    expand(iterations: number) {
        for(let x = 0; x < iterations; x++) {
            let newExp = [];
            for(let i = 0; i < this.current.length; i++) {
                //Add the expansion if it exists
                if(this.current[i] instanceof ExpRule) {
                    let exp = this.current[i].exp();
                    for(let j = 0; j < exp.length; j++) {
                        newExp.push(exp[j]);
                    }
                } else {
                    //Else, add the same rule
                    newExp.push(this.current[i]);
                }
            }
            this.current = newExp;
            this.expHistory.push(newExp);
        }
    }

    process() {
        for(let i = 0; i < this.current.length; i++) {
            //Call function if the rule has one
            if(this.current[i] instanceof FnRule) {
                this.current[i].func();
            }
        }
    }

    clear() {
        turtle = new Turtle(vec3.fromValues(0, 0, 0), 
        vec3.fromValues(0, 1, 0), vec3.fromValues(1, 0, 0), vec3.fromValues(0, 0, -1));
        history = [];

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

        Building.count = 0;
        Cube.count = 0;
        Floor.count = 0;
        Rotate.count = 0;
        Forward.count = 0;
        Up.count = 0;
        Right.count = 0;
        Translate.count = 0;
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
}