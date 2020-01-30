
#pragma DECLARE_FUNCTION DERIVATIVES:enable
void NormalFromPosition(const in vec3 pos,
                        out vec3 normalOutput ) 
{
#ifdef GL_OES_standard_derivatives
    vec3 fdx = dFdx(pos);
    vec3 fdy = dFdy(pos);
    normalOutput = normalize(cross(fdx, fdy));
#endif
}
