import {vec2} from 'gl-matrix'

export var gl: WebGL2RenderingContext;
export function setGL(_gl: WebGL2RenderingContext) {
  gl = _gl;
}

export function random1( s: number) {
    // let v = vec2.fromValues(vec2.dot(vec2.add(vec2.create(), p, seed), vec2.fromValues(311.7, 127.1)), 
    //                         vec2.dot(vec2.add(vec2.create(), p, seed), vec2.fromValues(269.5, 183.3)));
    let p = vec2.fromValues(1.5802 * s, 78.291);
    let seed = vec2.fromValues(9.309, 5.201 / s);
  
    let x1 = p[0] + seed[0];
    let x2 = p[1] + seed[1];
    let v = vec2.fromValues(x1 * 311.7 + x2 * 127.1,
                            x1 * 269.5 + x2 * 183.3);
    //sin
    v = vec2.fromValues(Math.sin(v[0]), Math.sin(v[1]));
    //fract
    return vec2.fromValues(v[0] - Math.floor(v[0]), v[1] - Math.floor(v[1]))[0];
  }

// Converts from degrees to radians.
export function radians(degrees : number) {
    return degrees * Math.PI / 180;
};

export function readTextFile(file: string): string
{
    var text = "";
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                text = allText;
            }
        }
    }
    rawFile.send(null);
    return text;
}