

#pragma DECLARE_FUNCTION
void NormalFromTexture( const in sampler2D normalTexture,
                        const in vec2 texcoord,
                        out vec3 normalOutput ) 
{
    vec3 t = texture2D(normalTexture, texcoord).xyz;
    normalOutput = vec3((t.xy - vec2(0.5))*2.0, t.z);
}


#pragma DECLARE_FUNCTION
void GlossFromTexture( const in sampler2D glossTexture,
                        const in vec2 texcoord,
                        out float glossOutput ) 
{
    glossOutput = texture2D(glossTexture, texcoord).r;
}

vec3 specularPhong(const in float NdotL, const in vec3 N, const in vec3 L, const in vec3 V, const in float materialShininess, const in vec3 materialSpecular, const in vec3 lightSpecular)  
{
        vec3 H = reflect(-L, N);
        float HdotV = max(dot(H, V), 0.0);

        float shine = clamp(materialShininess, 1.0, 128.0);
        return lightSpecular*materialSpecular * pow(HdotV, shine);
}

#pragma DECLARE_FUNCTION
void FactoryShading(const in vec3 normal, 
                    const in vec3 eyeVector, 
                    const in float dotNL, 
                    const in float attenuation, 
                    const in vec3 materialDiffuse, 
                    const in vec3 materialSpecular,
                    const in float materialShininess,
                    const in vec3 lightDiffuse,
                    const in vec3 lightSpecular,
                    const in vec3 eyeLightDir,
                    out vec3 diffuseOut,
                    out vec3 specularOut,
                    out bool lighted)
{    
        lighted = dotNL > 0.0;
        if (lighted == false) {
            specularOut = diffuseOut = vec3(0.0);
            return;
        } 

        diffuseOut = dotNL*materialDiffuse.rgb*lightDiffuse.rgb;

        // L: vertex to light
        vec3 L = normalize(eyeLightDir);         
    
        specularOut = specularPhong(dotNL, normal, L, eyeVector, materialShininess, materialSpecular.rgb, lightSpecular);          
}
