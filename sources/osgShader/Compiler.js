import notify from 'osg/notify';
import Uniform from 'osg/Uniform';
import factory from 'osgShader/nodeFactory';
import utils from 'osg/utils';
import CompilerVertex from 'osgShader/CompilerVertex';
import CompilerFragment from 'osgShader/CompilerFragment';

var Compiler = function(attributes, textureAttributes, shaderProcessor) {
    this._attributes = attributes;
    this._textureAttributes = textureAttributes;

    this._fragmentShaderMode = false; // current context

    this._activeNodeMap = {};
    this._compiledNodeMap = {};
    this._traversedNodeMap = {};

    this._variables = {};
    this._varyings = {};
    this._vertexShader = [];
    this._fragmentShader = [];

    this._shaderProcessor = shaderProcessor;
    this._texturesByName = {};

    // TODO: Have to handle better textures
    // 4 separate loop over texture list: one here, one for declareTexture, 2 for vertexShader (varying decl + varying store)
    // (not counting loops done above in shader generator)

    this._shadowsTextures = [];
    this._lights = [];
    this._shadows = [];
    this._textures = [];
    this._material = null;

    this._invariantPosition = false;
    this._isBillboard = false;

    // Important: if not using Compiler for Both VS and FS Check either of those
    // it allow override by custom Processor of some check between the VS & FS pass (varying mostly)
    this._customVertexShader = false;
    this._customFragmentShader = false;

    // from Attributes to variables to build shader nodes graph from
    this.initAttributes();
    this.initTextureAttributes();
};

Compiler.cloneStateAttributeConfig = function(compilerClass) {
    return JSON.parse(JSON.stringify(compilerClass.stateAttributeConfig));
};

Compiler.setStateAttributeConfig = function(compilerClass, config) {
    compilerClass.stateAttributeConfig = config;

    config.attribute.forEach(utils.getOrCreateStateAttributeTypeMemberIndexFromName);
    config.textureAttribute.forEach(utils.getOrCreateTextureStateAttributeTypeMemberIndexFromName);

    compilerClass.validAttributeTypeMember = config.attribute;
    compilerClass.validTextureAttributeTypeMember = config.textureAttribute;
};

Compiler.setStateAttributeConfig(Compiler, {
    attribute: [
        'Light0',
        'ShadowReceive0',
        'Light1',
        'ShadowReceive1',
        'Light2',
        'ShadowReceive2',
        'Light3',
        'ShadowReceive3',
        'Light4',
        'Light5',
        'Light6',
        'Light7',
        'Material',
        'PointSize',
        'Billboard',
        'Morph',
        'Skinning'
    ],
    textureAttribute: ['Texture']
});

Compiler.prototype = utils.extend({}, CompilerVertex, CompilerFragment, {
    constructor: Compiler,

    createFragmentShader: function() {
        this._fragmentShaderMode = true;
        return this._createFragmentShader();
    },

    createVertexShader: function() {
        this._fragmentShaderMode = false;
        return this._createVertexShader();
    },

    getOrCreateProjectionMatrix: function() {
        return this.getOrCreateUniform('mat4', 'uProjectionMatrix');
    },

    getCompilerName: function() {
        return this._material ? 'CompilerOSGJS' : 'NoMaterialCompilerOSGJS';
    },

    getFragmentShaderName: function() {
        var compilerName = this.getCompilerName();

        var materialName = this._material && this._material.getName();
        if (materialName) {
            // escape everything but letter and number
            materialName = materialName.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 20);
            compilerName += '(' + materialName + ')';
        }

        return compilerName;
    },

    getVertexShaderName: function() {
        return this.getFragmentShaderName();
    },

    getDebugIdentifier: function() {
        var vname = this.getVertexShaderName();
        var fname = this.getFragmentShaderName();
        return vname === fname ? fname : vname + '|' + fname;
    },

    logError: function(msg) {
        notify.error(this.getDebugIdentifier() + ' : ' + msg);
    },

    logWarn: function(msg) {
        notify.warn(this.getDebugIdentifier() + ' : ' + msg);
    },

    getOrCreateConstantOne: function(type) {
        return this.getOrCreateConstant(type, type + 'White').setValue(type + '(1.0)');
    },

    getOrCreateConstantZero: function(type) {
        return this.getOrCreateConstant(type, type + 'Black').setValue(type + '(0.0)');
    },

    initAttributes: function() {
        var attributes = this._attributes;
        var lights = this._lights;
        var shadows = this._shadows;
        for (var i = 0, l = attributes.length; i < l; i++) {
            var type = attributes[i].className();

            // Test one light at a time
            if (type === 'Light') {
                // && lights.length === 0) {
                lights.push(attributes[i]);
            } else if (type === 'Material') {
                this._material = attributes[i];
            } else if (type === 'ShadowReceiveAttribute') {
                shadows.push(attributes[i]);
            } else if (type === 'Billboard') {
                this._isBillboard = !!attributes[i];
            } else if (type === 'SkinningAttribute') {
                this._skinningAttribute = attributes[i];
            } else if (type === 'MorphAttribute') {
                this._morphAttribute = attributes[i];
            } else if (type === 'PointSizeAttribute') {
                this._pointSizeAttribute = attributes[i];
            }
        }
    },

    initTextureAttributes: function() {
        var textureAttributes = this._textureAttributes;
        var texturesNum = textureAttributes.length;
        this._textures.length = this._shadowsTextures.length = texturesNum;

        for (var j = 0; j < texturesNum; j++) {
            var tu = textureAttributes[j];
            if (tu === undefined) {
                continue;
            }

            for (var t = 0, tl = tu.length; t < tl; t++) {
                this.registerTextureAttributes(tu[t], j);
            }
        }
    },

    registerTextureAttributes: function(tuTarget, tunit) {
        var tType = tuTarget.className();
        if (tType === 'Texture') return this.registerTexture(tuTarget, tunit);
        if (tType.indexOf('ShadowTexture') !== -1)
            return this.registerTextureShadow(tuTarget, tunit);
    },

    registerTexture: function(tuTarget, texUnit) {
        var tName = tuTarget.getName();
        if (!tName) {
            tName = 'Texture' + texUnit;
            tuTarget.setName(tName);
        }
        this._textures[texUnit] = tuTarget;

        this._texturesByName[tName] = {
            texture: tuTarget,
            variable: undefined,
            textureUnit: texUnit
        };
    },

    registerTextureShadow: function(tuTarget, texUnit) {
        var tName = tuTarget.getName();
        if (!tName) {
            tName = 'Texture' + texUnit;
            tuTarget.setName(tName);
        }
        this._shadowsTextures[texUnit] = tuTarget;

        this._texturesByName[tName] = {
            texture: tuTarget,
            variable: undefined,
            textureUnit: texUnit,
            shadow: true
        };
    },

    getTextureByName: function(name) {
        var texObj = this._texturesByName[name];
        if (!texObj || texObj.variable) return texObj;

        var texture = texObj.texture;
        var texCoordUnit = texObj.textureUnit;

        var textureSampler;

        var className = texture.className();
        var samplerName = 'Texture' + texCoordUnit;
        if (className === 'Texture') {
            textureSampler = this.getOrCreateSampler('sampler2D', samplerName);
        } else if (className === 'TextureCubeMap') {
            textureSampler = this.getOrCreateSampler('samplerCube', samplerName);
        } else {
            return;
        }

        var texCoord = this._fragmentShaderMode
            ? this.getOrCreateVarying('vec2', 'vTexCoord' + texCoordUnit)
            : this.getOrCreateAttribute('vec2', 'TexCoord' + texCoordUnit);

        texObj.variable = this.createTextureRGBA(texture, textureSampler, texCoord);

        return texObj;
    },

    // The Compiler Main Code called on Vertex or Fragment Shader Graph
    createShaderFromGraphs: function(roots) {
        this._compiledNodeMap = {};

        // list all vars
        var variables = [];
        for (var keyVariable in this._variables) {
            var varNode = this._variables[keyVariable];
            var d = varNode.declare();
            if (d) {
                variables.push(d);
            }
        }

        // defines and extensions are added by process shader
        var extensions = this.evaluateExtensions(roots);
        var defines = this.evaluateDefines(roots);

        var shaderStack = [];
        shaderStack.push('\n');
        shaderStack.push(this.evaluateGlobalVariableDeclaration(roots));
        if (this._invariantPosition && !this._fragmentShaderMode)
            shaderStack.push('\ninvariant gl_Position;');
        shaderStack.push('\n');
        shaderStack.push(this.evaluateGlobalFunctionDeclaration(roots));

        shaderStack.push('void main() {');

        // declare variables in main
        if (variables.length !== 0) {
            shaderStack.push('// vars\n');
            shaderStack.push(variables.join(' '));
            shaderStack.push('\n// end vars\n');
        }

        // make sure we have at least one output
        if (roots.length === 0) {
            this.logError('shader without any final Node output (need at least one)');
        }

        shaderStack.push(this.evaluate(roots));

        shaderStack.push('}');

        // Shader Graph has been outputed an array of string
        // we concatenate it to a shader string program
        var shaderStr = shaderStack.join('\n');

        // Process defines, add precision, resolve include pragma
        var shader = this._shaderProcessor.processShader(
            shaderStr,
            defines,
            extensions,
            this._fragmentShaderMode ? 'fragment' : 'vertex'
        );

        /*develblock:start*/
        // Check
        var compiledNodes = this._compiledNodeMap;
        var activeNodes = this._activeNodeMap;
        var messages = [];
        for (var key in activeNodes) {
            if (compiledNodes[key]) continue;

            var node = activeNodes[key];
            if (node.silenceWarning) continue;

            var msg = '[' + node.toString() + ']:';
            var nodeInputs = node.getInputs();
            for (var i = 0; i < nodeInputs.length; ++i) {
                var nodeInput = nodeInputs[i];
                msg += '\n - Computed by ' + nodeInput.getType();

                var argOutputs = nodeInput.getOutputs();
                for (var keyOutput in argOutputs) {
                    if (argOutputs[keyOutput] === node) {
                        msg += ' - as ' + keyOutput;
                    }
                }
            }

            messages.push(msg);
        }

        if (messages.length) {
            this.logWarn('Nodes requested, but not compiled:\n' + messages.join('\n\n'));
        }
        /*develblock:end*/

        return shader;
    },

    _logLookForVariable: function(args, variable) {
        var res = [];
        for (var key in args) {
            if (args[key] === variable) {
                res.push(key);
            }
        }
        return res;
    },

    getNode: function(/*name, arg1, etc*/) {
        var n = factory.getNode.apply(factory, arguments);
        if (!n) notify.error('Unknown Node type : ' + arguments[0]);
        var cacheID = n.getID();
        this._activeNodeMap[cacheID] = n;
        return n;
    },

    getVariable: function(nameID) {
        return this._variables[nameID];
    },

    getAttributeType: function(type) {
        for (var i = 0; i < this._attributes.length; i++) {
            if (this._attributes[i].getType() === type) return this._attributes[i];
        }
        return undefined;
    },

    // TODO: add Precision qualifier
    // if doesn't exist create a new on
    // if nameID given and var already exist, create a varname +
    createVariable: function(type, varname, deepness) {
        var nameID = varname;

        if (nameID === undefined) {
            var len = window.Object.keys(this._variables).length;
            nameID = 'tmp_' + len;
        } else if (this._variables[nameID]) {
            // create a new variable
            // if we want to reuse a variable we should NOT
            // call this function in the first place and do the
            // test before...
            // however for uniform, varying and sampler, we return
            // the variable if it already exists, because they are
            // meant to be read only
            nameID = nameID + deepness;
            if (deepness === undefined) {
                return this.createVariable(type, varname, 1);
            } else if (this._variables[nameID]) {
                deepness++;
                return this.createVariable(type, varname, deepness);
            }
        }

        var v = this.getNode('Variable', type, nameID);
        this._variables[nameID] = v;
        return v;
    },

    getOrCreateUniform: function(type, varname, size) {
        var nameID = varname;

        // accept uniform as parameter to simplify code
        if (type instanceof Uniform) {
            var uniform = type;
            type = uniform.getType();
            nameID = uniform.getName();
        } else if (nameID === undefined) {
            this.logError('Cannot create unamed Uniform');
        }

        var exist = this._variables[nameID];
        if (exist) {
            if (exist.getType() === type) {
                return exist;
            }

            /*develblock:start*/
            // texture has a particular "dual" type of uniform a sampler2D
            // a int pointing to the texture unit the sampler2D represents
            if (exist.getType() === 'sampler2D' && type !== 'sampler2D') {
                this.logError(
                    'Same uniform, but different type (' +
                        type +
                        ', ' +
                        exist.getType() +
                        ', ' +
                        exist.getVariable() +
                        ')'
                );
            }
            /*develblock:end*/
        }

        var v = this.getNode('Uniform', type, nameID, size);
        this._variables[nameID] = v;

        return v;
    },

    // make sure we get correct Node
    getOrCreateSampler: function(type, varname) {
        if (varname === undefined) {
            this.logError('No name given for sampler type : ' + type);
        }

        var exist = this._variables[varname];
        if (exist) {
            return exist; // see comment in Variable function
        }

        var v = this.getNode('Sampler', type, varname);
        this._variables[varname] = v;

        return v;
    },

    // make sure we get correct Node
    getOrCreateAttribute: function(type, nameID) {
        if (this._fragmentShaderMode) {
            this.logError('No Vertex Attribute in Fragment Shader');
        }

        var exist = this._variables[nameID];
        if (exist) {
            /*develblock:start*/
            if (exist.getType() !== type) {
                this.logError('Same attribute, but different type');
            }
            /*develblock:end*/

            return exist;
        }

        var v = this.getNode('Attribute', type, nameID);
        this._variables[nameID] = v;
        return v;
    },

    getOrCreateConstant: function(type, varname) {
        var nameID = varname;
        if (nameID === undefined) {
            // TODO: temp constant ? or enforcing reuse ?
            // maybe could parse variable to find other constant
            // but would need having scope info
            var len = window.Object.keys(this._variables).length;
            nameID = 'tmp_' + len;
        } else {
            var exist = this._variables[nameID];
            if (exist) {
                /*develblock:start*/
                if (exist.getType() !== type) {
                    this.logError('Same constant name, but different type');
                }
                /*develblock:end*/

                // see comment in Variable function
                return exist;
            }
        }

        var v = this.getNode('Constant', type, nameID);
        this._variables[nameID] = v;
        return v;
    },

    // make sure we get correct Node
    getOrCreateVarying: function(type, nameID) {
        if (nameID === undefined) {
            this.logError('Error: Mandatory to name varying (as you need to retrieve them)');
        }

        var variable = this._variables[nameID];
        if (variable) {
            if (!this._varyings[nameID]) {
                this.logError(
                    'Error: requesting a varying not declared with getOrCreateVarying previously'
                );
            }

            if (variable.getType() !== type) {
                this.logError('Error: Same varying, but different type');
            }

            return variable;
        }

        // if it's not in Varying Cache, but requested from vertex shader it means => error
        if (!this._fragmentShaderMode && !this._customFragmentShader) {
            this.logError(
                'Error: requesting a varying not declared in Fragment Shader Graph (for Custom Vertex Shader, add this._customFragmentShader to the processor): ' +
                    nameID +
                    ' ' +
                    type
            );
        }

        variable = this._variables[nameID] = this._varyings[nameID] = this.getNode(
            'Varying',
            type,
            nameID
        );

        return variable;
    },

    //////////////////
    // TRAVERSE STUFFS
    //////////////////

    markNodeAsVisited: function(n) {
        var cacheID = n.getID();
        if (this._activeNodeMap[cacheID] === n) {
            this._compiledNodeMap[cacheID] = n;
        } else {
            this.logWarn(
                'Node not requested by using Compiler getNode and/or not registered in nodeFactory ' +
                    n.toString()
            );
        }
    },

    // make sure we traverse once per evaluation of graph
    checkOrMarkNodeAsTraversed: function(n) {
        var cacheID = n.getID();
        if (this._traversedNodeMap[cacheID]) {
            return true;
        }
        this._traversedNodeMap[cacheID] = n;
        return false;
    },

    // TODO: add a visitor to debug the graph
    traverse: function(functor, node) {
        if (this.checkOrMarkNodeAsTraversed(node)) return;

        var inputs = node.getInputs();
        if (!Array.isArray(inputs)) {
            var objectToArray = [];
            for (var keyInput in inputs) {
                objectToArray.push(inputs[keyInput]);
            }
            inputs = objectToArray;
        }

        for (var i = 0, l = inputs.length; i < l; i++) {
            node.checkInputsOutputs();

            var child = inputs[i];
            if (child && child !== node) {
                this.traverse(functor, child);
            }
        }
        functor.call(functor, node);

        // keep trace we visited
        this.markNodeAsVisited(node);
    },

    _getAndInitFunctor: function(func) {
        this._traversedNodeMap = {};

        var map = {};
        var text = [];
        func = func.bind(this, map, text);
        func._map = map;
        func._text = text;

        return func;
    },

    _functorEvaluateAndGatherField: function(field, map, text, node) {
        var idx = node.getType();
        if (idx === undefined || idx === '') {
            this.logError('Your node ' + node + ' has no type');
        }

        if (!node[field] || map[idx]) return;
        map[idx] = true;

        Array.prototype.push.apply(text, node[field]());
    },

    // Gather a particular output field
    // for now one of
    // ['define', 'extensions']
    //
    // from a nodeGraph
    //
    // In case a node of same Type have different outputs (shadow with different defines)
    // it use ID rather than Type as map index UNIQUE PER TYPE
    // TODO: adds includes so that we can remove it from the eval Global Functions ?
    evaluateAndGatherField: function(nodes, field) {
        var func = this._getAndInitFunctor(this._functorEvaluateAndGatherField.bind(this, field));

        for (var j = 0, jl = nodes.length; j < jl; j++) {
            this.traverse(func, nodes[j]);
        }

        return func._text;
    },

    _functorEvaluateGlobalFunctionDeclaration: function(map, text, node) {
        // UNIQUE PER TYPE
        var idx = node.getType();
        if (idx === undefined || idx === '') {
            this.logError('Your node ' + node + ' has no type');
        }

        if (!node.globalFunctionDeclaration || map[idx]) return;
        map[idx] = true;

        var decl = node.globalFunctionDeclaration();
        if (decl) text.push(decl);
    },

    // Gather a functions declartions of nodesfrom a nodeGraph
    // (for now pragma include done here too. could be done with define/etc...)
    // Node of same Type has to share exact same "node.globalFunctionDeclaration" output
    // as it use Type rather than ID as map index
    evaluateGlobalFunctionDeclaration: function(nodes) {
        var func = this._getAndInitFunctor(this._functorEvaluateGlobalFunctionDeclaration);

        for (var j = 0, jl = nodes.length; j < jl; j++) {
            this.traverse(func, nodes[j]);
        }

        return func._text.join('\n');
    },

    _functorEvaluateGlobalVariableDeclaration: function(map, text, node) {
        // UNIQUE PER NODE
        var idx = node.getID();
        if (!node.globalDeclaration || map[idx]) return;
        map[idx] = true;

        var decl = node.globalDeclaration();
        if (decl) text.push(decl);
    },

    // Gather a Variables declarations of nodes from a nodeGraph to be outputted
    // outside the VOID MAIN code ( Uniforms, Varying )
    // Node of same Type has different output as it use Type rather than ID as map index
    evaluateGlobalVariableDeclaration: function(nodes) {
        var func = this._getAndInitFunctor(this._functorEvaluateGlobalVariableDeclaration);

        var i = 0;
        var nbNodes = nodes.length;
        for (i = 0; i < nbNodes; i++) {
            this.traverse(func, nodes[i]);
        }

        // beautify/formatting with empty line between type of var
        var declarations = func._text;
        var len = declarations.length;
        if (len > 0) {
            this.sortDeclarations(declarations);

            var type = declarations[0][0];
            for (i = 0; i < len; ++i) {
                var iType = declarations[i][0];
                if (iType !== type) {
                    type = iType;
                    declarations[i - 1] += '\n';
                }
            }
        }

        return declarations.join('\n');
    },

    sortDeclarations: function(declarations) {
        // sort in alphabetical order attr, unif, sample, varying
        declarations.sort();

        if (this._fragmentShaderMode) return;

        // making sure Vertex is always coming first (because of webgl warning)
        for (var i = 0, len = declarations.length; i < len; ++i) {
            var vatt = declarations[i];

            if (vatt[0] !== 'a') break;

            if (vatt.indexOf('Vertex') !== -1) {
                declarations.splice(i, 1);
                declarations.unshift(vatt);
                break;
            }
        }
    },

    _functorEvaluate: function(map, text, node) {
        var id = node.getID();
        if (map[id]) return;
        map[id] = true;

        var shader = node.computeShader();
        if (!shader) return;

        var comment = node.getComment && node.getComment();
        if (comment) text.push(comment);
        text.push(shader);
    },

    evaluate: function(nodes) {
        var func = this._getAndInitFunctor(this._functorEvaluate);

        for (var j = 0, jl = nodes.length; j < jl; j++) {
            this.traverse(func, nodes[j]);
        }

        return func._text.join('\n');
    },

    evaluateDefines: function(roots) {
        return this.evaluateAndGatherField(roots, 'getDefines');
    },

    evaluateExtensions: function(roots) {
        return this.evaluateAndGatherField(roots, 'getExtensions');
    },

    /////////////////////
    // Model space varying
    /////////////////////
    getOrCreateModelVertex: function() {
        if (this._fragmentShaderMode) {
            return this.getOrCreateVarying('vec3', 'vModelVertex');
        }

        var out = this._variables.modelVertex;
        if (out) return out;
        out = this.createVariable('vec3', 'modelVertex');

        this.getNode('MatrixMultPosition')
            .inputs({
                matrix: this.getOrCreateUniform('mat4', 'uModelMatrix'),
                vec: this.getOrCreateLocalVertex()
            })
            .outputs({ vec: out });

        return out;
    },

    getOrCreateModelNormal: function() {
        if (this._fragmentShaderMode) {
            return this.getOrCreateVarying('vec3', 'vModelNormal');
        }

        var out = this._variables.modelNormal;
        if (out) return out;
        out = this.createVariable('vec3', 'modelNormal');

        this.getNode('MatrixMultDirection')
            .inputs({
                matrix: this.getOrCreateUniform('mat3', 'uModelNormalMatrix'),
                vec: this.getOrCreateLocalNormal()
            })
            .outputs({ vec: out });

        return out;
    },

    getOrCreateModelTangent: function() {
        if (this._fragmentShaderMode) {
            return this.getOrCreateVarying('vec4', 'vModelTangent');
        }

        var out = this._variables.modelTangent;
        if (out) return out;
        out = this.createVariable('vec4', 'modelTangent');

        this.getNode('MatrixMultDirection')
            .setOverwriteW(false)
            .inputs({
                matrix: this.getOrCreateUniform('mat3', 'uModelNormalMatrix'),
                vec: this.getOrCreateLocalTangent()
            })
            .outputs({ vec: out });

        return out;
    },

    /////////////////////
    // View space varying
    /////////////////////
    getOrCreateViewVertex: function() {
        if (this._fragmentShaderMode) {
            return this.getOrCreateVarying('vec4', 'vViewVertex');
        }

        var out = this._variables.viewVertex;
        if (out) return out;
        out = this.createVariable('vec4', 'viewVertex');

        this.getNode('MatrixMultPosition')
            .inputs({
                matrix: this.getOrCreateUniform('mat4', 'uModelViewMatrix'),
                vec: this.getOrCreateLocalVertex()
            })
            .outputs({ vec: out });

        return out;
    },

    getOrCreateViewNormal: function() {
        if (this._fragmentShaderMode) {
            return this.getOrCreateVarying('vec3', 'vViewNormal');
        }

        var out = this._variables.viewNormal;
        if (out) return out;
        out = this.createVariable('vec3', 'viewNormal');

        this.getNode('MatrixMultDirection')
            .inputs({
                matrix: this.getOrCreateUniform('mat3', 'uModelViewNormalMatrix'),
                vec: this.getOrCreateLocalNormal()
            })
            .outputs({ vec: out });

        return out;
    },

    getOrCreateViewTangent: function() {
        if (this._fragmentShaderMode) {
            return this.getOrCreateVarying('vec4', 'vViewTangent');
        }

        var out = this._variables.viewTangent;
        if (out) return out;
        out = this.createVariable('vec4', 'viewTangent');

        this.getNode('MatrixMultDirection')
            .setOverwriteW(false)
            .inputs({
                matrix: this.getOrCreateUniform('mat3', 'uModelViewNormalMatrix'),
                vec: this.getOrCreateLocalTangent()
            })
            .outputs({ vec: out });

        return out;
    }
});

export default Compiler;
