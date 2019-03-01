#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;

out vec4 out_Col;

void main()
{
    vec3 lightPos = vec3(0, 60, 60);
    vec3 toLight = normalize(lightPos - vec3(fs_Pos));
    float intensity = clamp(dot(toLight, vec3(fs_Nor)), 0.f, 1.f);
    out_Col = 0.4 * fs_Col + 0.6 * vec4(vec3(fs_Col) * intensity, 1);
}
