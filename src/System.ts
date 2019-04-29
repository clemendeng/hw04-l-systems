import {vec3, vec4, mat4, quat} from 'gl-matrix'
import {radians, random1} from './globals';
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

let seed = 1;

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
    //Strings are just for gui
    s: string;
    
    //Parameters are for function/expansion function
    params: number[];
    paramNames: string[];
    children?: Rule[];
    childHi?: number;
    childLo?: number;
    indexes?: number[];

    //The iteration number this rule corresponds to
    depth: number;
    index: number;

    exp?(startIndex: number): Rule[];
    func?(): void;

    setName(): void;

    //Function to change a parameter of the rule
    changeParam(paramNum: number, newValue: number): void;
}

export abstract class ExpRule implements Rule {
    s: string;
    params: number[];
    paramNames: string[];
    children: Rule[];
    childLo: number;
    childHi: number;

    depth: number;
    index: number;

    constructor(s: string, paramNames: string[], params: number[], depth: number, index: number) {
        this.s = s;
        this.paramNames = paramNames;
        this.params = params;
        this.children = [];
        this.childLo = -1;
        this.childHi = -1;
        this.depth = depth;
        this.index = index;
    }

    abstract exp(startIndex: number): Rule[];
    abstract setName(): void;
    abstract changeParam(paramNum: number, newValue: number): void;
}

export abstract class FnRule implements Rule {
    s: string;
    params: number[];
    paramNames: string[];
    indexes: number[];

    depth: number;
    index: number;

    constructor(s: string, paramNames: string[], params: number[], depth: number, index: number) {
        this.s = s;
        this.paramNames = paramNames;
        this.params = params;
        this.indexes = [];
        this.indexes[depth] = index;
        this.depth = depth;
        this.index = index;
    }

    abstract func(): void;
    abstract setName(): void;
    abstract changeParam(paramNum: number, newValue: number): void;
}

class Flower extends ExpRule {
    seedLength: number;
    angle: number;
    numPetals: number;
    curve: number;
    static count: number = 0;

    constructor(depth: number, index: number, seedLength: number, angle: number, numPetals: number, curve: number) {
        super("Flower" + Flower.count++, ["Seed Length", "Angle", "Num Petals", "Curve"], 
            [seedLength, angle, numPetals, curve], depth, index);
        this.seedLength = seedLength
        this.angle = angle;
        this.numPetals = numPetals;
        this.curve = curve;
    }

    exp(startIndex: number) {
        let target: Rule[] = [];

        target.push(new Grow(this.depth + 1, startIndex + target.length, 4));

        let angle = 360 / this.numPetals;
        for(let curr = 0; curr < 360; curr += 360 / this.numPetals) {
            target.push(new Rotate(this.depth + 1, startIndex + target.length, 1, angle));
            target.push(new Save(this.depth + 1, startIndex + target.length));
            target.push(new Petal(this.depth + 1, startIndex + target.length, this.seedLength, this.angle, this.curve));
            target.push(new Load(this.depth + 1, startIndex + target.length));
        }

        this.children = target;
        return target;
    }

    setName() {
        this.s = "Flower" + Flower.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.seedLength = newValue;
        } else if(paramNum == 1) {
            this.angle = newValue;
        } else if(paramNum == 2) {
            this.numPetals = newValue;
        } else if(paramNum == 3) {
            this.curve = newValue;
        }
    }
}

class Petal extends ExpRule {
    seedLength: number;
    angle: number;
    curve: number;
    static count: number = 0;

    constructor(depth: number, index: number, seedLength: number, angle: number, curve: number) {
        super("Petal" + Petal.count++, ["Seed Length", "Angle", "Curve"], [seedLength, angle, curve], depth, index);
        this.seedLength = seedLength
        this.angle = angle;
        this.curve = curve;
    }

    exp(startIndex: number) {
        let target: Rule[] = [];

        target.push(new Color(this.depth + 1, startIndex + target.length, 78/255, 1/255, 1/255));
        target.push(new Save(this.depth + 1, startIndex + target.length));
        target.push(new Grow(this.depth + 1, startIndex + target.length, this.seedLength));
        target.push(new Load(this.depth + 1, startIndex + target.length));
        target.push(new Rotate(this.depth + 1, startIndex + target.length, 0, 30));
        target.push(new Save(this.depth + 1, startIndex + target.length));
        target.push(new Grow(this.depth + 1, startIndex + target.length, this.seedLength));
        target.push(new Load(this.depth + 1, startIndex + target.length));
        target.push(new Rotate(this.depth + 1, startIndex + target.length, 0, 45));
        target.push(new Color(this.depth + 1, startIndex + target.length, 1, 1, 1));
        target.push(new PetalCurve(this.depth + 1, startIndex + target.length, this.curve));

        this.children = target;
        return target;
    }

    setName() {
        this.s = "Petal" + Petal.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.seedLength = newValue;
        } else if(paramNum == 1) {
            this.angle = newValue;
        } else if(paramNum == 2) {
            this.curve = newValue;
        }
    }
}

class PetalCurve extends ExpRule {
    static count: number = 0;
    curve: number;

    constructor(depth: number, index: number, curve: number) {
        super("PetalCurve" + PetalCurve.count++, ["Curve"], [curve], depth, index);
        this.curve = curve;
    }

    exp(startIndex: number) {
        let target: Rule[] = [];

        target.push(new Grow(this.depth + 1, startIndex + target.length, 1));
        target.push(new PetalCurver(this.depth + 1, startIndex + target.length, this.curve));
        target.push(new PetalCurve(this.depth + 1, startIndex + target.length, this.curve));

        return target;
    }

    setName() {
        this.s = "PetalCurve" + PetalCurve.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.curve = newValue;
        }
    }
}

class PetalCurver extends FnRule {
    curve: number;
    static count: number = 0;

    constructor(depth: number, index: number, curve: number) {
        super("petalCurver" + PetalCurver.count++, ["Curve"], [curve], depth, index);
        this.curve = curve;
    }

    func() {
        if(turtle.scale[0] == 0) {
            return;
        }
        let perp : vec3 = vec3.fromValues(turtle.orientation[0], 0, turtle.orientation[2]);
        vec3.normalize(perp, perp);
        let up : vec3 = vec3.fromValues(0, 1, 0);
        let target : vec3 = vec3.create();
        vec3.add(target, vec3.scale(perp, perp, 1.0 - this.curve), vec3.scale(up, up, this.curve));
        vec3.normalize(target, target);
        let q: quat = quat.create();
        quat.rotationTo(q, turtle.orientation, target);
        let axis : vec3 = vec3.create();
        let angle : number = quat.getAxisAngle(axis, q);
        quat.setAxisAngle(q, axis, angle * turtle.orientation[1] / 10);
        quat.normalize(q, q);
        vec3.transformQuat(turtle.orientation, turtle.orientation, q);
        vec3.normalize(turtle.orientation, turtle.orientation);
        vec3.transformQuat(turtle.up, turtle.up, q);
        vec3.normalize(turtle.up, turtle.up);
        turtle.scale[0] = turtle.scale[0] - 0.3;
        turtle.scale[2] = turtle.scale[2] - 0.3;
        if(turtle.scale[0] < 0) {
            turtle.scale[0] = 0;
            turtle.scale[2] = 0;
        }
        vec4.subtract(turtle.color, turtle.color, vec4.fromValues(0.06, 0.08, 0.08, 0));
    }

    setName() {
        this.s = "petalCurver" + PetalCurver.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.curve = newValue;
        }
    }
}

class Trunk extends ExpRule {
    length: number;
    thickness: number;
    branchProb: number;
    branchAngle: number;
    static count: number = 0;

    constructor(depth: number, index: number, length: number, thickness: number, branchProb: number, branchAngle: number) {
        super("Trunk" + Trunk.count++, ["Length", "Thickness", "Branch Prob", "Branch Angle"], 
            [length, thickness, branchProb, branchAngle], depth, index);
        this.length = length;
        this.thickness = thickness;
        this.branchProb = branchProb;
        this.branchAngle = branchAngle;
    }

    exp(startIndex: number) {
        let target: Rule[] = [];

        target.push(new Color(this.depth + 1, startIndex + target.length, 0.1, 0.1, 0.1));
        target.push(new Scale(this.depth + 1, startIndex + target.length, this.thickness));
        target.push(new Grow(this.depth + 1, startIndex + target.length, 4));
        for(let i = 0; i < this.length; i++) {
            target.push(new Scale(this.depth + 1, startIndex + target.length, -0.25));
            if(random1(seed++) < this.branchProb) {
                target.push(new TrunkBranch(this.depth + 1, startIndex + target.length, 30, 0.15, 0.5, this.branchAngle));
            }
            target.push(new Grow(this.depth + 1, startIndex + target.length, 1));
        }

        this.children = target;
        return target;
    }

    setName() {
        this.s = "Trunk" + Trunk.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.length = newValue;
        } else if(paramNum == 1) {
            this.thickness = newValue;
        }  else if(paramNum == 2) {
            this.branchProb = newValue;
        } else if(paramNum == 3) {
            this.branchAngle = newValue;
        }
    }
}

class TrunkBranch extends ExpRule {
    angleRange: number;
    displace: number;
    scale: number;
    curve: number;
    static count: number = 0;

    constructor(depth: number, index: number, angleRange: number, displace: number, scale: number, curve: number) {
        super("TrunkBranch" + TrunkBranch.count++, ["Angle Range", "Displace", "Scale", "Curve"], 
            [angleRange, displace, scale, curve], depth, index);
        this.angleRange = angleRange;
        this.displace = displace;
        this.scale = scale;
        this.curve = curve;
    }

    exp(startIndex: number) {
        let target: Rule[] = [];

        target.push(new Save(this.depth + 1, startIndex + target.length));
        target.push(new Branch(this.depth + 1, startIndex + target.length, 
            this.angleRange, this.angleRange * 2, this.displace, this.scale));
        target.push(new TrunkExtend(this.depth + 1, startIndex + target.length, this.curve));
        target.push(new Load(this.depth + 1, startIndex + target.length));
        target.push(new RandDir(this.depth + 1, startIndex + target.length, 45, 180));

        this.children = target;
        return target;
    }

    setName() {
        this.s = "TrunkBranch" + TrunkBranch.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.angleRange = newValue;
        } else if(paramNum == 1) {
            this.displace = newValue;
        } else if(paramNum == 2) {
            this.scale = newValue;
        } else if(paramNum == 3) {
            this.curve = newValue;
        }
    }
}

class TrunkExtend extends ExpRule {
    static count: number = 0;
    rotation: number;

    constructor(depth: number, index: number, rotation: number) {
        super("TrunkExtend" + TrunkExtend.count++, ["Curve"], [rotation], depth, index);
        this.rotation = rotation;
    }

    exp(startIndex: number) {
        let target: Rule[] = [];

        for(let i = 0; i < 3; i++) {
            target.push(new BranchRotate(this.depth + 1, startIndex + target.length, this.rotation * 3 / 10));
            target.push(new Scale(this.depth + 1, startIndex + target.length, -0.1));
            target.push(new Grow(this.depth + 1, startIndex + target.length, 1));
            target.push(new Person(this.depth + 1, startIndex + target.length, 1));
        }
        target.push(new BranchRotate(this.depth + 1, startIndex + target.length, 5 * 3 / 10));
        target.push(new Scale(this.depth + 1, startIndex + target.length, -0.1));

        target.push(new TrunkBranch(this.depth + 1, startIndex + target.length, 15, 0.1, 0.75, 5));

        target.push(new Grow(this.depth + 1, startIndex + target.length, 1));
        target.push(new Person(this.depth + 1, startIndex + target.length, 1));

        target.push(new TrunkExtend(this.depth + 1, startIndex + target.length, this.rotation));

        return target;
    }

    setName() {
        this.s = "TrunkExtend" + TrunkExtend.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.rotation = newValue;
        }
    }
}

class Grow extends FnRule {
    dist: number;
    static count: number = 0;

    constructor(depth: number, index: number, dist: number) {
        super("grow" + Grow.count++, ["Distance"], [dist], depth, index);
        this.dist = dist;
    }

    func() {
        let tempScale = turtle.scale[1];
        turtle.scale[1] = turtle.scale[1] * this.dist;
        let dist = turtle.scale[1];
        draw(1);
        turtle.scale[1] = tempScale;
        vec3.add(turtle.position, turtle.position, vec3.scale(vec3.create(), turtle.orientation, dist));
    }

    setName() {
        this.s = "grow" + Grow.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.dist = newValue;
        }
    }
}

class Scale extends FnRule {
    t: number;
    static count: number = 0;

    constructor(depth: number, index: number, t: number) {
        super("scale" + Scale.count++, ["Amount"], [t], depth, index);
        this.t = t;
    }

    func() {
        if(turtle.scale[0] == 0) {
            return;
        }
        turtle.scale[0] += this.t;
        turtle.scale[2] += this.t;
        if(turtle.scale[0] < 0) {
            turtle.scale[0] = 0;
            turtle.scale[2] = 0;
        }
    }

    setName() {
        this.s = "scale" + Scale.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.t = newValue;
        }
    }
}

class Branch extends FnRule {
    minAngle: number;
    maxAngle: number;
    displace: number;
    scale: number;
    static count: number = 0;

    constructor(depth: number, index: number, minAngle: number, maxAngle: number, displace: number, scale: number) {
        super("branch" + Branch.count++, ["Min Angle", "Max Angle", "Displace", "Scale"], 
            [minAngle, maxAngle, displace, scale], depth, index);
        this.minAngle = minAngle;
        this.maxAngle = maxAngle;
        this.displace = displace;
        this.scale = scale;
    }

    func() {
        let r: quat = quat.create();
        quat.setAxisAngle(r, turtle.orientation, radians(turtle.branchAngle));
        quat.normalize(r, r);
        vec3.transformQuat(turtle.right, turtle.right, r);
        vec3.normalize(turtle.right, turtle.right);
        vec3.transformQuat(turtle.up, turtle.up, r);
        vec3.normalize(turtle.up, turtle.up);
        //Displace
        let temp : vec3 = vec3.create();
        vec3.add(turtle.position, turtle.position, vec3.scale(temp, turtle.up, this.displace * turtle.scale[0]));
        turtle.scale[0] = turtle.scale[0] * this.scale;
        turtle.scale[2] = turtle.scale[2] * this.scale;

        //Angle: 30-60
        let t : number = random1(seed++) * (this.maxAngle - this.minAngle);
        let q : quat = quat.create();
        quat.setAxisAngle(q, turtle.right, radians(-this.minAngle - t));
        quat.normalize(q, q);
        vec3.transformQuat(turtle.orientation, turtle.orientation, q);
        vec3.normalize(turtle.orientation, turtle.orientation);
        vec3.transformQuat(turtle.up, turtle.up, q);
        vec3.normalize(turtle.up, turtle.up);
    }

    setName() {
        this.s = "branch" + Branch.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.minAngle = newValue;
        } else if(paramNum == 1) {
            this.maxAngle = newValue;
        } else if(paramNum == 2) {
            this.displace = newValue;
        } else if(paramNum == 3) {
            this.scale = newValue;
        }
    }
}

class BranchRotate extends FnRule {
    curveAngle: number;
    static count: number = 0;

    constructor(depth: number, index: number, curveAngle: number) {
        super("branchRotate" + BranchRotate.count++, ["Curve Angle"], [curveAngle], depth, index);
        this.curveAngle = curveAngle;
    }

    func() {
        let pos : vec3 = turtle.position;
        //HACK TO AVOID FLOWER: APPLIES FOR HEIGHT AND WIDTH OF 20
        if(pos[0] < 7 && pos[2] < 7 && pos[1] > 29) {
            turtle.scale[0] = 0;
            turtle.scale[2] = 0;
        }
        let q: quat = quat.create();
        quat.setAxisAngle(q, turtle.right, radians(-this.curveAngle));
        quat.normalize(q, q);
        vec3.transformQuat(turtle.orientation, turtle.orientation, q);
        vec3.normalize(turtle.orientation, turtle.orientation);
        vec3.transformQuat(turtle.up, turtle.up, q);
        vec3.normalize(turtle.up, turtle.up);
        
        if(turtle.depth % 2 == 1) {
            turtle.color = vec4.fromValues(0.4, 0.4, 0.4, 1);
        } else {
            turtle.color = vec4.fromValues(40/255, 10/255, 10/255, 1);
        }
    }

    setName() {
        this.s = "branchRotate" + BranchRotate.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.curveAngle = newValue;
        }
    }
}

class RandDir extends FnRule {
    min: number;
    max: number
    static count: number = 0;

    constructor(depth: number, index: number, min: number, max: number) {
        super("randDir" + RandDir.count++, ["Min Angle", "Max Angle"], [min, max], depth, index);
        this.min = min;
        this.max = max
    }

    func() {
        let t : number = random1(seed++) * (this.max - this.min);
        turtle.branchAngle = (turtle.branchAngle + this.min + t) % 360;
    }

    setName() {
        this.s = "randDir" + RandDir.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.min = newValue;
        } else if(paramNum == 1) {
            this.max = newValue;
        }
    }
}

class Person extends FnRule {
    scale: number;
    static count: number = 0;

    constructor(depth: number, index: number, scale: number) {
        super("person" + Person.count++, ["Scale"], [scale], depth, index);
        this.scale = scale;
    }

    func() {
        if(turtle.scale[0] > 0.1 || turtle.scale[0] <= 0 || random1(seed++) < 0.5) {
            return;
        }
        let tempScale = vec3.clone(turtle.scale);
        let tempOrient = vec3.clone(turtle.orientation);
        turtle.scale = vec3.fromValues(this.scale, this.scale, this.scale);
        turtle.orientation = vec3.fromValues(0, 1, 0);
        draw(2);
        turtle.scale = tempScale;
        turtle.orientation = tempOrient;
    }

    setName() {
        this.s = "person" + Person.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.scale = newValue;
        }
    }
}

class Building extends ExpRule {
    width: number;
    height: number;
    floorHeight: number;
    numWindows: number;
    windowWidth: number;
    static count: number = 0;

    constructor(depth: number, index: number, width: number, height: number, numWindows: number, windowWidth: number) {
        super("Building" + Building.count++, 
            ["Width", "Height", "Windows", "Window Width"],
            [width, height, numWindows, windowWidth], depth, index);
        this.width = width;
        this.height = height;
        this.floorHeight = 2;
        this.numWindows = numWindows;
        this.windowWidth = windowWidth;
    }

    exp(startIndex: number) {
        let target: Rule[] = [];

        let currHeight = 0;
        //Add floors until no room for a floor
        while(currHeight <= this.height - this.floorHeight) {
            //Create floor
            let floor = new Floor(this.depth + 1, startIndex + target.length, this.width, this.floorHeight, this.numWindows, this.windowWidth);
            target.push(floor);
            this.children.push(floor);
            //Go to next floor
            let nextFloor = new Translate(this.depth + 1, startIndex + target.length, 0, this.floorHeight, 0);
            target.push(nextFloor);
            this.children.push(nextFloor);
            //Update height to check if there is room for a floor
            currHeight += this.floorHeight;
        }
        this.children = target;
        return target;
    }

    setName() {
        this.s = "Building" + Building.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.width = newValue;
        } else if(paramNum == 1) {
            this.height = newValue;
        } else if(paramNum == 2) {
            this.numWindows = newValue;
        } else if(paramNum == 3) {
            this.windowWidth = newValue;
        }
    }
}

class Floor extends ExpRule {
    width: number;
    height: number;
    numWindows: number;
    windowWidth: number;
    static count: number = 0;

    constructor(depth: number, index: number, width: number, height: number, numWindows: number, windowWidth: number) {
        super("Floor" + Floor.count++, ["Width", "Height", "Windows", "Window Width"], 
            [width, height, numWindows, windowWidth], depth, index);
        this.width = width;
        this.height = height;
        this.numWindows = numWindows;
        this.windowWidth = windowWidth;
    }

    exp(startIndex: number) {
        let target: Rule[] = [];

        //The actual floor
        let cube = new Cube(this.depth + 1, startIndex + target.length, this.width - 1, this.height - 0.5, this.width - 1);
        target.push(cube);

        //The windows
        target.push(new Save(this.depth + 1, startIndex + target.length));

        //Face +z direction
        target.push(new Rotate(this.depth + 1, startIndex + target.length, 0, -90));
        for(let i = 0; i < 4; i++) {
            target.push(new Rotate(this.depth + 1, startIndex + target.length, 2, 90));
            target.push(new Save(this.depth + 1, startIndex + target.length));
            target.push(new Forward(this.depth + 1, startIndex + target.length, (this.width - 1) / 2));
            target.push(new Up(this.depth + 1, startIndex + target.length, this.height / 2));

            let evenR = true;
            let evenL = true;
            if(this.numWindows % 2 == 1) {
                evenR = false;
                evenL = false;
                target.push(new Cube(this.depth + 1, startIndex + target.length, this.windowWidth, this.windowWidth, this.windowWidth));
            }

            //Windows on the right
            target.push(new Save(this.depth + 1, startIndex + target.length));
            for(let j = 0; j < Math.floor(this.numWindows / 2); j++) {
                if(evenR) {
                    target.push(new Right(this.depth + 1, startIndex + target.length, this.windowWidth * .75));
                    evenR = false;
                } else {
                    target.push(new Right(this.depth + 1, startIndex + target.length, this.windowWidth * 1.5));
                }
                target.push(new Cube(this.depth + 1, startIndex + target.length, this.windowWidth, this.windowWidth, this.windowWidth));
            }
            target.push(new Load(this.depth + 1, startIndex + target.length));
            //Windows on the left
            target.push(new Save(this.depth + 1, startIndex + target.length));
            for(let j = 0; j < Math.floor(this.numWindows / 2); j++) {
                if(evenL) {
                    target.push(new Right(this.depth + 1, startIndex + target.length, -this.windowWidth * .75));
                    evenL = false;
                } else {
                    target.push(new Right(this.depth + 1, startIndex + target.length, -this.windowWidth * 1.5));
                }
                target.push(new Cube(this.depth + 1, startIndex + target.length, this.windowWidth, this.windowWidth, this.windowWidth));
            }
            target.push(new Load(this.depth + 1, startIndex + target.length));
            target.push(new Load(this.depth + 1, startIndex + target.length));
        }

        target.push(new Load(this.depth + 1, startIndex + target.length));
        this.children = target;
        return target;
    }

    setName() {
        this.s = "Floor" + Floor.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.width = newValue;
        } else if(paramNum == 1) {
            this.height = newValue;
        } else if(paramNum == 2) {
            this.numWindows = newValue;
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

    constructor(depth: number, index: number, x: number, y: number, z: number) {
        super("cube" + Cube.count++, ["x", "y", "z"], [x, y, z], depth, index);
        this.x = x;
        this.y = y;
        this.z = z;
    }

    func() {
        turtle.scale = vec3.fromValues(this.x, this.y, this.z);
        draw(0);
    }

    setName() {
        this.s = "Cube" + Cube.count++;
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

class Rotate extends FnRule {
    axis: number;
    degrees: number;
    static count: number = 0;

    constructor(depth: number, index: number, axis: number, degrees: number) {
        super("rotate" + Rotate.count++, ["Axis", "Degrees"], [axis, degrees], depth, index);
        this.axis = axis;
        this.degrees = degrees;
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

    setName() {
        this.s = "rotate" + Rotate.count++;
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

    constructor(depth: number, index: number, dist: number) {
        super("forward" + Forward.count++, ["Distance"], [dist], depth, index);
        this.dist = dist;
    }

    func() {
        vec3.add(turtle.position, turtle.position, vec3.scale(vec3.create(), turtle.orientation, this.dist));
    }

    setName() {
        this.s = "forward" + Forward.count++;
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

    constructor(depth: number, index: number, dist: number) {
        super("up" + Up.count++, ["Distance"], [dist], depth, index);
        this.dist = dist;
    }

    func() {
        vec3.add(turtle.position, turtle.position, vec3.scale(vec3.create(), turtle.up, this.dist));
    }

    setName() {
        this.s = "up" + Up.count++;
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

    constructor(depth: number, index: number, dist: number) {
        super("right" + Right.count++, ["Distance"], [dist], depth, index);
        this.dist = dist;
    }

    func() {
        vec3.add(turtle.position, turtle.position, vec3.scale(vec3.create(), turtle.right, this.dist));
    }

    setName() {
        this.s = "Right" + Right.count++;
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

    constructor(depth: number, index: number, x: number, y: number, z: number) {
        super("translate" + Translate.count++, ["x", "y", "z"], [x, y, z], depth, index);
        this.x = x;
        this.y = y;
        this.z = z;
    }

    func() {
        vec3.add(turtle.position, turtle.position, vec3.fromValues(this.x, this.y, this.z));
    }

    setName() {
        this.s = "translate" + Translate.count++;
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

class Color extends FnRule{
    r: number;
    g: number;
    b: number;
    static count: number = 0;

    constructor(depth: number, index: number, r: number, g: number, b: number) {
        super("color" + Color.count++, ["r", "g", "b"], [r, g, b], depth, index);
        this.r = r;
        this.g = g;
        this.b = b;
    }

    func() {
        turtle.color = vec4.fromValues(this.r, this.g, this.b, 1);
    }

    setName() {
        this.s = "color" + Color.count++;
    }

    changeParam(paramNum: number, newValue: number) {
        this.params[paramNum] = newValue;
        if(paramNum == 0) {
            this.r = newValue;
        } else if(paramNum == 1) {
            this.g = newValue;
        } else if(paramNum == 2) {
            this.b = newValue;
        }
    }
}

class Save extends FnRule {
    constructor(depth: number, index: number) {
        super("save", [], [], depth, index);
    }

    func() {
        history.push(turtle.clone());
        turtle.incr();
    }

    setName() {}

    changeParam(paramNum: number, newValue: number) {}
}

class Load extends FnRule {
    constructor(depth: number, index: number) {
        super("load", [], [], depth, index);
    }

    func() {
        turtle = history.pop();
    }

    setName() {}

    changeParam(paramNum: number, newValue: number) {}
}

export class System {
    axiom: Rule[];
    currDepth: number;
    current: Rule[];
    //Index refers to iteration number
    expHistory: Rule[][];

    constructor() {
        this.axiom = [];
        this.current = [];
        this.expHistory = [];
        this.clear();
    }

    setup(scene: number) {
        this.axiom = [];
        this.current = [];
        let r: Rule;
        if(scene == 1) {
            turtle.color = vec4.fromValues(0.5, 1, 0.5, 1);
            r = new Building(0, 0, 10, 30, 5, 1);
            this.axiom.push(r);
            this.current.push(r);
        } else if(scene == 2) {
            r = new Trunk(0, 0, 10, 6, 0.6, 5);
            this.axiom.push(r);
            this.current.push(r);
            r = new Flower(0, 1, 1.5, 75, 24, 0.7);
            this.axiom.push(r);
            this.current.push(r);
        }
        this.expHistory = [];
        this.expHistory.push(this.current);
        this.currDepth = 0;
        seed = 1;
    }

    expand(iterations: number) {
        for(let x = 0; x < iterations; x++) {
            let newExp = [];
            for(let i = 0; i < this.current.length; i++) {
                //Add the expansion if it exists
                if(this.current[i] instanceof ExpRule) {
                    let exp = this.current[i].exp(newExp.length);
                    if(exp.length > 0) {
                        this.current[i].childLo = newExp.length;
                    }
                    for(let j = 0; j < exp.length; j++) {
                        newExp.push(exp[j]);
                    }
                    this.current[i].childHi = newExp.length - 1;
                } else {
                    //Else, add the same rule
                    this.current[i].indexes[this.currDepth + 1] = newExp.length;
                    newExp.push(this.current[i]);
                    this.current[i].depth++;
                }
            }
            if(this.current.length >= newExp.length) {
                break;
            }
            this.current = newExp;
            this.expHistory.push(newExp);
            this.currDepth++;
        }
    }

    process() {
        for(let i = 0; i < this.current.length; i++) {
            this.current[i].setName();
            //Call function if the rule has one
            if(this.current[i] instanceof FnRule) {
                this.current[i].func();
            }
        }
    }

    clear() {
        //Resets processing variables
        let color = turtle.color;
        turtle = new Turtle(vec3.fromValues(0, 0, 0), 
        vec3.fromValues(0, 1, 0), vec3.fromValues(1, 0, 0), vec3.fromValues(0, 0, -1));
        turtle.color = color;
        history = [];
        seed = 1;

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
        Trunk.count = 0;
        TrunkBranch.count = 0;
        TrunkExtend.count = 0;
        Grow.count = 0;
        Scale.count = 0;
        Branch.count = 0;
        BranchRotate.count = 0;
        RandDir.count = 0;
        Person.count = 0;
        Building.count = 0;
        Cube.count = 0;
        Floor.count = 0;
        Rotate.count = 0;
        Forward.count = 0;
        Up.count = 0;
        Right.count = 0;
        Translate.count = 0;
    }

    updateChangedParam(rule: Rule) {
        if(rule.depth == this.currDepth || rule instanceof FnRule) {
            return;
        }
        let parentLo = rule.index;
        let parentHi = rule.index;
        let currLo = rule.childLo;
        let currHi = rule.childHi;
        for(let depth = rule.depth + 1; depth <= this.currDepth; depth++) {
            debugger;
            let lo = this.expHistory[depth][currLo];
            let hi = this.expHistory[depth][currHi];
            let nextRemoveLo = lo.childLo;
            let nextRemoveHi = hi.childHi;
            if(lo instanceof FnRule && depth + 1 < lo.indexes.length) {
                nextRemoveLo = lo.indexes[depth + 1];
            }
            if(hi instanceof FnRule && depth + 1 < hi.indexes.length) {
                nextRemoveHi = hi.indexes[depth + 1];
            }
            //Add the new elements
            let startIndex = currLo;
            let index = currLo;
            for(let i = parentLo; i <= parentHi; i++) {
                let curr = this.expHistory[depth - 1][i];
                if(curr instanceof FnRule) {
                    this.expHistory[depth].splice(index, 0, curr);
                    curr.indexes[depth] = index;
                    index++;
                } else {
                    let exp = curr.exp(index);
                    curr.childLo = index;
                    curr.childHi = index + exp.length - 1;
                    for(let j = 0; j < exp.length; j++) {
                        this.expHistory[depth].splice(index + j, 0, exp[j]);
                    }
                    index += exp.length;
                }
            }
            debugger;
            //Remove the elements that are to be changed
            this.expHistory[depth].splice(index, currHi - currLo + 1);
            
            let addend = (index - startIndex) - (currHi - currLo + 1);
            //NOT CHANGING CURRENT INDEX
            for(let i = parentHi + 1; i < this.expHistory[depth - 1].length; i++) {
                let r = this.expHistory[depth - 1][i];
                if(r.childLo && r.childHi) {
                    r.childLo += addend;
                    r.childHi += addend;
                } else if(r.indexes && depth < r.indexes.length) {
                    r.indexes[depth] += addend;
                }
            }
            parentLo = startIndex;
            parentHi = index - 1;
            currLo = nextRemoveLo;
            currHi = nextRemoveHi;
        }
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