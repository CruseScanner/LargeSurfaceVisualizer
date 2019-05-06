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
uniform vec4 uDisplacementOffsetScale;
uniform float uDisplacementRange;
#endif

varying vec4 vVertexColor;
varying vec4 vViewVertex;

void main() 
{
    vec3 vertex = vec3(Vertex, 0.0);

    // Skirts are outside the [0..1]^2 domain
   
#ifdef WITH_DISPLACEMENT_MAP
    vec2 d = max(-vertex.xy, vertex.xy - vec2(1.0));
    float displace = max(0.0, max(d.x, d.y));
#endif
    // Clip vertex to [0..1] domain   
    vertex = min(vec3(1.0), max(vec3(0.0), vertex));
  
    vertex = vec3(vertex.xy*uOffsetScale.zw + uOffsetScale.xy, 0.0);
    
#ifdef WITH_DISPLACEMENT_MAP
    vec2 displacementUV = Vertex*uDisplacementOffsetScale.zw + uDisplacementOffsetScale.xy;  
    vertex.z+= (texture2D(Texture3, displacementUV).r-displace)*uDisplacementRange;
#endif 
        
    vec4 viewVertex = uModelViewMatrix*vec4(vertex, 1.0);
    gl_Position = uProjectionMatrix*viewVertex;

#ifndef WITH_NORMAL_MAP
    vViewNormal = uModelViewNormalMatrix*vec3(0.0, 0.0, 1.0);
#endif

    vViewVertex = viewVertex;
    vTexCoord0 = Vertex; //TexCoord0;
}
