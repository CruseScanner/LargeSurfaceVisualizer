#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

#define SHADER_NAME ScanViewerFragment

//uniform vec3 uLight0_viewDirection;
uniform vec4 uLight0_viewPosition;
uniform vec4 uLight0_ambient;
uniform vec4 uLight0_diffuse;
uniform vec4 uLight0_specular;

uniform vec4 uMaterialAmbient;
uniform vec4 uMaterialDiffuse;
uniform vec4 uMaterialEmission;
uniform vec4 uMaterialSpecular;
uniform float uMaterialShininess;

uniform float uLODLevel;

uniform sampler2D Texture0;

varying vec2 vTexCoord0;
varying vec4 vViewVertex;

#if 0
vec3 specularPhongBlinn(
const in vec3 N, const in vec3 L, const in vec3 V, const in float materialShininess, const in vec3 materialSpecular, const in vec3 lightSpecular) 
{
    vec3 H = normalize(L + V);
    float NdotH = dot(N, H);
    float specfac = 0.0;
    if(NdotH > 0.0) {
        float HdotV = max(dot(H, V), 0.0);
        float i = pow(HdotV, shine);
        i = i / (0.1 + HdotV);
        specfac = i;
    }
    // ugly way to fake an energy conservation (mainly to avoid super bright stuffs with low glossiness)
    float att = materialShininess > 100.0 ? 1.0 : smoothstep(0.0, 1.0, materialShininess * 0.01);
    return specfac * materialSpecular * lightSpecular * att;
}
#endif

vec3 specularPhong(const in float NdotL, const in vec3 N, const in vec3 L, const in vec3 V, const in float materialShininess, const in vec3 materialSpecular, const in vec3 lightSpecular)  
{
    if (NdotL > 0.0)
    {
        vec3 H = reflect(-L, N);
        float HdotV = max(dot(H, V), 0.0);

        float shine = clamp(materialShininess, 1.0, 128.0);
        return lightSpecular*materialSpecular * pow(HdotV, shine);
    }
    return vec3(0.0);
}

#ifdef WITH_NORMAL_MAP
uniform mat3 uModelViewNormalMatrix;
uniform sampler2D Texture1;
#else
varying vec3 vViewNormal;
#endif

#ifdef WITH_GLOSS_MAP
uniform sampler2D Texture2;
#endif

// All components are in the range [0…1], including hue.
vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() 
{
    vec3 diffuseTexture = texture2D(Texture0, vTexCoord0).rgb;

#ifdef WITH_NORMAL_MAP
    vec3 t = texture2D(Texture1, vTexCoord0).xyz;
    vec3 N = vec3((t.xy - vec2(0.5))*2.0, t.z);
    N = uModelViewNormalMatrix*N;    
#else
    // Get double-sided normal
    vec3 N = gl_FrontFacing ? vViewNormal : -vViewNormal;
#endif



    N = normalize(N);

    // L: vertex to light
    vec3 L = normalize(uLight0_viewPosition.xyz - uLight0_viewPosition.w*vViewVertex.xyz);         
    // V: vertex to eye 
    vec3 V = normalize(-vViewVertex.xyz);

    float NdotL = max(dot(N, L), 0.0);
    
    //vec3 specularContribution = specularPhongBlinn(N, L, V, uMaterialShininess, uMaterialSpecular.rgb, uLight0_specular.rgb);
    vec3 specularContribution = specularPhong(NdotL, N, L, V, uMaterialShininess, uMaterialSpecular.rgb, uLight0_specular.rgb);

    vec3 diffuseContribution = NdotL*uMaterialDiffuse.rgb*uLight0_diffuse.rgb;
    diffuseContribution+= uMaterialAmbient.rgb*uLight0_ambient.rgb;
   
    vec3 totalContribution = diffuseContribution*diffuseTexture;

#ifdef WITH_GLOSS_MAP
    // Modulate by gloss map
    specularContribution*= texture2D(Texture2, vTexCoord0).r;
#endif
    
    totalContribution+= specularContribution;
    totalContribution+= uMaterialEmission.rgb;
    
#ifdef WITH_DEBUG_LOD 
    gl_FragColor = vec4(hsv2rgb(vec3(uLODLevel / 5.0, 0.5, 0.2)) * (totalContribution.r + totalContribution.g + totalContribution.b), 1.0);  
#else
    gl_FragColor = vec4(totalContribution, 1.0);     
#endif
}
