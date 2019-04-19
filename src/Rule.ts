import {vec3, mat4} from 'gl-matrix'
import Turtle from './Turtle'

export class Rule {
    //Strings are just for gui (?)
    s: string;
    sExpansion: string;

    //Child relations
    expansion: Rule[];

    //Parameters are for function/expansion function
    params: number[];
    func: () => void;
    //Calling the expansion function will create children rules and set relations
    //Also sets expansion and sExpansion
    exp: (params: number[]) => Rule[];

    //Turtle state when rule is used; get post turtle state by calling func
    state: Turtle;

    //The iteration number this rule corresponds to
    depth: number;

    constructor(s: string) {
        this.s = s;
        this.params = [];
    }

    copy(p: Rule) {
        this.s = p.s;
        return this;
    }

    clone() {
        let newR = new Rule(undefined);
        return newR.copy(this);
    }

    addRule(r: Rule) {

    }
}

export default class system {
    axiom: Rule;
    current: Rule[];
    //Index refers to iteration number
    expHistory: Rule[][];
    turtle: Turtle;
    history: Turtle[];

    //Instanced arrays to give to GPU
    transform1Arrays : number[][];
    transform2Arrays : number[][];
    transform3Arrays : number[][];
    transform4Arrays : number[][];
    colorsArrays : number[][];
    nums : number[];

    constructor(ax: Rule) {
        this.axiom = ax;
        this.current = [];
        this.current.push(this.axiom);
        this.expHistory = [this.current];
        this.turtle = new Turtle(vec3.fromValues(0, 0, 0), 
        vec3.fromValues(0, 1, 0), vec3.fromValues(1, 0, 0), vec3.fromValues(0, 0, -1));
        this.history = [];

        this.transform1Arrays = [];
        this.transform2Arrays = [];
        this.transform3Arrays = [];
        this.transform4Arrays = [];
        this.colorsArrays = [];
        this.nums = [0, 0, 0, 0];
        for(let i = 0; i < 4; i++) {
            this.transform1Arrays[i] = [];
            this.transform2Arrays[i] = [];
            this.transform3Arrays[i] = [];
            this.transform4Arrays[i] = [];
            this.colorsArrays[i] = [];
        }
    }

    setupBuilding() {
        //Building: Width, Height, FloorHeight, WindowWidth
        let building = new Rule("B");
        building.params.push(5);
        building.params.push(10);
        building.params.push(1);
        building.params.push(0.2);

        building.state = this.turtle.clone();

        //4 parameters: width, height, floorHeight, windowWidth
        function bExp(params: number[]) {
            let target = [];

            let width = params[0];
            let height = params[1];
            let floorHeight = params[2];
            let windowWidth = params[3];

            let currHeight = 0;
            //Add floors until no room for a floor
            while(currHeight <= height - floorHeight) {
                let floor = new Rule("F");
                floor.params.push(width);
                floor.params.push(floorHeight);
                floor.params.push(windowWidth);

                floor.state = this.turtle.clone();

                function fExp() {

                }

                let nextFloor = new Rule("p" + floorHeight + "u");
                nextFloor.params.push(floorHeight);
                nextFloor.func = ;

                target.push(nextFloor);
                currHeight += floorHeight;
            }

            return target;
        }

        building.exp = bExp;
    }
    
    forward(t: number) {
        vec3.add(this.turtle.position, this.turtle.position, vec3.scale(vec3.create(), this.turtle.orientation, t));
    }

    save() {
        this.history.push(this.turtle.clone());
    }

    load() {
        this.turtle = this.history.pop();
    }

    expand() {
        let newExp = [];
        for(let i = 0; i < this.current.length; i++) {
            //Add the expansion if it exists
            if(this.current[i].exp) {
                let exp = this.current[i].exp(this.current[i].params);
                for(let j = 0; j < exp.length; j++) {
                    newExp.push(exp[j]);
                }
            } else {
                //Else, add the same rule
                newExp.push(this.current[i]);
            }
        }
        this.current = newExp;
    }

    process() {
        for(let i = 0; i < this.current.length; i++) {
            //Call function if the rule has one
            if(this.current[i].func) {
                this.current[i].func();
            }
        }
    }

    draw(i: number) {
        let t : mat4 = this.turtle.getTransform();

        this.transform1Arrays[i].push(t[0]);
        this.transform1Arrays[i].push(t[1]);
        this.transform1Arrays[i].push(t[2]);
        this.transform1Arrays[i].push(t[3]);

        this.transform2Arrays[i].push(t[4]);
        this.transform2Arrays[i].push(t[5]);
        this.transform2Arrays[i].push(t[6]);
        this.transform2Arrays[i].push(t[7]);

        this.transform3Arrays[i].push(t[8]);
        this.transform3Arrays[i].push(t[9]);
        this.transform3Arrays[i].push(t[10]);
        this.transform3Arrays[i].push(t[11]);

        this.transform4Arrays[i].push(t[12]);
        this.transform4Arrays[i].push(t[13]);
        this.transform4Arrays[i].push(t[14]);
        this.transform4Arrays[i].push(t[15]);

        this.colorsArrays[i].push(this.turtle.color[0]);
        this.colorsArrays[i].push(this.turtle.color[1]);
        this.colorsArrays[i].push(this.turtle.color[2]);
        this.colorsArrays[i].push(this.turtle.color[3]);
        
        this.nums[i]++;
    }
}