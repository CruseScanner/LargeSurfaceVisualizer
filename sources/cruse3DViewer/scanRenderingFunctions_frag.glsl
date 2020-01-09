

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