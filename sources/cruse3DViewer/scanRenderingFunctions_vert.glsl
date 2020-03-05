
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


float GetDisplacement(const in vec3 originalVertex,
                     const in vec4 displacementOffsetScale, 
                     const in float displacementRange,
                     const in sampler2D displacementMap) 
{
    // We encode skirts by placing them outside the [0..1]^2 domain
    // We then reproject onto the boundary (by clamping), and use the distance 
    // between original and clamped vertex as skirt displacement    
    vec2 d = max(-originalVertex.xy, originalVertex.xy - vec2(1.0));
    float displace = max(0.0, max(d.x, d.y));
    
    vec2 displacementUV = originalVertex.xy*displacementOffsetScale.zw + displacementOffsetScale.xy;
    return (texture2D(displacementMap, displacementUV).r-displace)*displacementRange;
}

#pragma DECLARE_FUNCTION
void DisplaceVertex( const in vec3 originalVertex,
                     const in vec3 tileTransformedVertex,
                     const in vec4 displacementOffsetScale, 
                     const in float displacementRange,
                     const in sampler2D displacementMap,
                     out vec3 vertexOutput ) 
{
    float displacement = GetDisplacement(originalVertex, displacementOffsetScale, displacementRange, displacementMap);
    vertexOutput = tileTransformedVertex; 
    vertexOutput.z+= displacement;
}

#pragma DECLARE_FUNCTION
void DisplaceNormal( const in vec3 originalVertex,                    
                     const in vec4 displacementOffsetScale, 
                     const in float displacementRange,
                     const in sampler2D displacementMap,
                     const in int textureWidth,
                     const in int textureHeight,                    
                     out vec3 displacedNormalOut ) 
{
    float epsilonX = 1.0 / (float(textureWidth)*displacementOffsetScale.z);
    float epsilonY = 1.0 / (float(textureHeight)*displacementOffsetScale.w);
    
    vec3 neighborVertX = vec3(epsilonX, 0, 0);
    vec3 neighborVertY = vec3(0, epsilonY, 0);
 
    float D0 = GetDisplacement(originalVertex + neighborVertX, displacementOffsetScale, displacementRange, displacementMap);
    float D1 = GetDisplacement(originalVertex - neighborVertX, displacementOffsetScale, displacementRange, displacementMap);
    float D2 = GetDisplacement(originalVertex + neighborVertY, displacementOffsetScale, displacementRange, displacementMap);
    float D3 = GetDisplacement(originalVertex - neighborVertY, displacementOffsetScale, displacementRange, displacementMap);
    
    
    float dDdx = (D0 - D1) / (2.0*epsilonX);
    float dDdy = (D2 - D3) / (2.0*epsilonY);
    
    displacedNormalOut = vec3(-dDdx, -dDdy, 1);
}
