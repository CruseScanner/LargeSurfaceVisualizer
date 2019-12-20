#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

#pragma DECLARE_FUNCTION
void TileDomainTransform( const in vec3 Vertex, 
                          const in vec4 offsetScale, 
                          out vec3 vertexOutput ) 
{
     vec3 vertex = Vertex;
  
    // We encode skirts by placing them outside the [0..1]^2 domain  
    // so we have to clip vertex to [0..1] domain here   
    vertex = min(vec3(1.0), max(vec3(0.0), vertex));

    // apply tile transform
    vertex = vec3(vertex.xy*offsetScale.zw + offsetScale.xy, 0.0);     
}


#pragma DECLARE_FUNCTION
void DisplaceVertex( const in int enableDisplacement, 
                     const in vec2 Vertex, 
                     const in vec4 offsetScale, 
                     const in vec4 diffuseMapOffsetScale, 
                     const in vec4 displacementOffsetScale, 
                     const in float displacementRange,
                     const in sampler2D displacementMap,
                     out vec3 vertexOutput ) 
{
    // We encode skirts by placing them outside the [0..1]^2 domain
    // We then reproject onto the boundary (by clamping), and use the distance 
    // between original and clamped vertex as skirt displacement    
    vec2 d = max(-Vertex, Vertex - vec2(1.0));
    float displace = max(0.0, max(d.x, d.y));

    vec3 vertex = vec3(Vertex, 0.0);

     // Clip vertex to [0..1] domain   
    vertex = min(vec3(1.0), max(vec3(0.0), vertex));

    // Derive texture coordinates
    //vTexCoord0 = vertex.xy*diffuseMapOffsetScale.zw + diffuseMapOffsetScale.xy; 
    vertexOutput = vec3(vertex.xy*offsetScale.zw + offsetScale.xy, 0.0);
    
    if( enableDisplacement == 1)
    {
        vec2 displacementUV = Vertex*displacementOffsetScale.zw + displacementOffsetScale.xy;  
        vertex.z+= (texture2D(displacementMap, displacementUV).r-displace)*displacementRange;
    } 
}
