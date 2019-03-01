#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

vec2 random2( vec2 p , vec2 seed) {
    return fract(sin(vec2(dot(p + seed, vec2(311.7, 127.1)), dot(p + seed, vec2(269.5, 183.3)))) * 85734.3545);
}

float falloff(float t) {
    return t*t*t*(t*(t*6.f - 15.f) + 10.f);
}

float lerp(float a, float b, float t) {
    return (1.0 - t) * a + t * b;
}

//ix and iy are the corner coordinates
float dotGridGradient(int ix, int iy, float x, float y, float seed) {
    vec2 dist = vec2(x - float(ix), y - float(iy));
    vec2 rand = (random2(vec2(ix, iy), vec2(seed, seed * 2.139)) * 2.f) - 1.f;
    return dist[0] * rand[0] + dist[1] * rand[1];
}

//Perlin returns a value in [-1, 1]
float perlin(vec2 pos, float seed) {
    //Pixel lies in (x0, y0)
    int x0 = int(floor(pos[0]));
    int x1 = x0 + 1;
    int y0 = int(floor(pos[1]));
    int y1 = y0 + 1;

    float wx = falloff(pos[0] - float(x0));
    float wy = falloff(pos[1] - float(y0));

    float n0, n1, ix0, ix1, value;
    n0 = dotGridGradient(x0, y0, pos[0], pos[1], seed);
    n1 = dotGridGradient(x1, y0, pos[0], pos[1], seed);
    ix0 = lerp(n0, n1, wx);
    n0 = dotGridGradient(x0, y1, pos[0], pos[1], seed);
    n1 = dotGridGradient(x1, y1, pos[0], pos[1], seed);
    ix1 = lerp(n0, n1, wx);
    value = lerp(ix0, ix1, wy);

    return value;
}

float fbmPerlin(vec2 pos, float octaves, float seed) {
    float total = 0.f;
    float persistence = 0.5;

    for(float i = 0.f; i < octaves; i++) {
        float freq = pow(2.f, i);
        //divide by 2 so that max is 1
        float amp = pow(persistence, i) / 1.f;
        total += ((perlin(pos * float(freq), seed) + 1.f) / 2.f) * amp;
    }

    return clamp(total, 0.f, 1.f);
}

void main() {
  float t = fbmPerlin(fs_Pos * 1.5, 1.f, 0.238);
  t = 1.f - t;
  t = smoothstep(0.25, 0.75, t);
  vec3 col = mix(vec3(0), vec3(78, 1, 1) * 4.f / 255.f, t);
  out_Col = vec4(col * 0.3, 1);
}
