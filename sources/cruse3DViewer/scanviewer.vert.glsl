#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

#define SHADER_NAME ScanViewerVertex

attribute vec2 Vertex;

uniform vec4 uOffsetScale;

uniform mat3 uModelViewNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec2 vTexCoord0;

#ifndef WITH_NORMAL_MAP
varying vec3 vViewNormal;
#endif

#ifdef WITH_DISPLACEMENT_MAP
uniform sampler2D Texture3;
#endif

varying vec4 vVertexColor;
varying vec4 vViewVertex;

void main() 
{
    vec3 vertex = vec3(Vertex*uOffsetScale.zw + uOffsetScale.xy, 0.0);
#ifdef WITH_DISPLACEMENT_MAP
    vertex.z+= texture2D(Texture3, Vertex + vec2(0.5/65.0, 0.5/65.0)).r*300.0;
#endif 
        
    vec4 viewVertex = uModelViewMatrix*vec4(vertex, 1.0);
    gl_Position = uProjectionMatrix*viewVertex;

#ifndef WITH_NORMAL_MAP
    vViewNormal = uModelViewNormalMatrix*vec3(0.0, 0.0, 1.0);
#endif

    vViewVertex = viewVertex;
    vTexCoord0 = Vertex; //TexCoord0;
}
