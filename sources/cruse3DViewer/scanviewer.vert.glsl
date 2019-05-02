#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

#define SHADER_NAME ScanViewerVertex

attribute vec3 Vertex;
attribute vec2 TexCoord0;

uniform mat3 uModelViewNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec2 vTexCoord0;

#ifndef WITH_NORMAL_MAP
varying vec3 vViewNormal;
#endif

#ifdef WITH_DISPLACEMENT_MAP
uniform sampled uDisplacementTexture;
#endif

varying vec4 vVertexColor;
varying vec4 vViewVertex;

void main() 
{
    vec4 viewVertex = uModelViewMatrix*vec4(Vertex.xyz, 1.0);
    gl_Position = uProjectionMatrix*viewVertex;

#ifndef WITH_NORMAL_MAP
    vViewNormal = uModelViewNormalMatrix*vec3(0.0, 0.0, 1.0);
#endif

    vViewVertex = viewVertex;
    vTexCoord0 = TexCoord0;
}
