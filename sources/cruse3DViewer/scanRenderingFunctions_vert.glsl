
#pragma DECLARE_FUNCTION
void TileDomainTransform( const in vec3 Vertex, 
                          const in vec4 offsetScale, 
                          out vec3 vertexOutput) 
{
     vec3 vertex = Vertex;
  
    // We encode skirts by placing them outside the [0..1]^2 domain  
    // so we have to clip vertex to [0..1] domain here   
    vertex = min(vec3(1.0), max(vec3(0.0), vertex));

    // apply tile transform
    vertexOutput = vec3(vertex.xy*offsetScale.zw + offsetScale.xy, 0.0);     
}

#pragma DECLARE_FUNCTION
void TexcoordFromTileDomain( const in vec3 Vertex, 
                             const in vec4 textureOffsetScale, 
                             out vec2 texcoordOutput ) 
{
     vec3 vertex = Vertex;
  
    // We encode skirts by placing them outside the [0..1]^2 domain  
    // so we have to clip vertex to [0..1] domain here   
    vertex = min(vec3(1.0), max(vec3(0.0), vertex));

    // Derive texture coordinates
    texcoordOutput = vertex.xy*textureOffsetScale.zw + textureOffsetScale.xy;
}


#pragma DECLARE_FUNCTION
void DisplaceVertex( const in vec3 originalVertex,
                     const in vec3 tileTransformedVertex,
                     const in vec4 displacementOffsetScale, 
                     const in float displacementRange,
                     const in sampler2D displacementMap,
                     out vec3 vertexOutput ) 
{
    // We encode skirts by placing them outside the [0..1]^2 domain
    // We then reproject onto the boundary (by clamping), and use the distance 
    // between original and clamped vertex as skirt displacement    
    vec2 d = max(-originalVertex.xy, originalVertex.xy - vec2(1.0));
    float displace = max(0.0, max(d.x, d.y));
    
    vec2 displacementUV = originalVertex.xy*displacementOffsetScale.zw + displacementOffsetScale.xy;
    vertexOutput = tileTransformedVertex; 
    vertexOutput.z+= (texture2D(displacementMap, displacementUV).r-displace)*displacementRange;
}
