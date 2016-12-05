// eslint-disable-next-line no-unused-vars, camelcase
var _elm_community$webgl$Native_WebGL = function () {

  // setup logging
  // eslint-disable-next-line no-unused-vars
  function LOG(msg) {
    // console.log(msg);
  }

  /* eslint-disable camelcase */
  function guid() {
    return _elm_lang$core$Native_Utils.guid();
  }
  function listEach(fn, list) {
    while (list.ctor !== '[]') {
      fn(list._0);
      list = list._1;
    }
  }
  function listLength(list) {
    var length = 0;
    while (list.ctor !== '[]') {
      length++;
      list = list._1;
    }
    return length;
  }
  /* eslint-enable camelcase */

  var rAF = typeof requestAnimationFrame !== 'undefined' ?
    requestAnimationFrame :
    function (cb) { setTimeout(cb, 1000 / 60); };

  function unsafeCoerceGLSL(src) {
    return { src: src };
  }

  function render(functionCalls, vert, frag, buffer, uniforms) {

    if (!buffer.guid) {
      buffer.guid = guid();
    }

    return {
      ctor: 'Renderable',
      vert: vert,
      frag: frag,
      buffer: buffer,
      uniforms: uniforms,
      functionCalls: functionCalls
    };

  }

  function doTexture(gl, texture) {

    var tex = gl.createTexture();
    LOG('Created texture');

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.img());
    switch (texture.filter.ctor) {
      case 'Linear':
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        break;
      case 'Nearest':
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        break;
    }
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;

  }

  function doCompile(gl, src, type) {

    var shader = gl.createShader(type);
    LOG('Created shader');

    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(shader);
    }

    return shader;

  }

  function doLink(gl, vshader, fshader) {

    var program = gl.createProgram();
    LOG('Created program');

    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(program);
    }

    return program;

  }

  function getRenderInfo(gl, renderType) {
    switch (renderType) {
      case 'Triangles':
        return { mode: gl.TRIANGLES, elemSize: 3, indexSize: 0 };
      case 'LineStrip':
        return { mode: gl.LINE_STRIP, elemSize: 1, indexSize: 0 };
      case 'LineLoop':
        return { mode: gl.LINE_LOOP, elemSize: 1, indexSize: 0 };
      case 'Points':
        return { mode: gl.POINTS, elemSize: 1, indexSize: 0 };
      case 'Lines':
        return { mode: gl.LINES, elemSize: 2, indexSize: 0 };
      case 'TriangleStrip':
        return { mode: gl.TRIANGLE_STRIP, elemSize: 1, indexSize: 0 };
      case 'TriangleFan':
        return { mode: gl.TRIANGLE_FAN, elemSize: 1, indexSize: 0 };
      case 'IndexedTriangles':
        return { mode: gl.TRIANGLES, elemSize: 1, indexSize: 3 };
    }
  }

  function getAttributeInfo(gl, type) {
    switch (type) {
      case gl.FLOAT:
        return { size: 1, type: Float32Array, baseType: gl.FLOAT };
      case gl.FLOAT_VEC2:
        return { size: 2, type: Float32Array, baseType: gl.FLOAT };
      case gl.FLOAT_VEC3:
        return { size: 3, type: Float32Array, baseType: gl.FLOAT };
      case gl.FLOAT_VEC4:
        return { size: 4, type: Float32Array, baseType: gl.FLOAT };
      case gl.INT:
        return { size: 1, type: Int32Array, baseType: gl.INT };
      case gl.INT_VEC2:
        return { size: 2, type: Int32Array, baseType: gl.INT };
      case gl.INT_VEC3:
        return { size: 3, type: Int32Array, baseType: gl.INT };
      case gl.INT_VEC4:
        return { size: 4, type: Int32Array, baseType: gl.INT };
    }
  }

 /**
  *  Form the buffer for a given attribute.
  *
  *  @param {WebGLRenderingContext} gl context
  *  @param {WebGLActiveInfo} attribute the attribute to bind to.
  *         We use its name to grab the record by name and also to know
  *         how many elements we need to grab.
  *  @param {List} bufferElems The list coming in from Elm.
  *  @param {Number} elemSize The length of the number of vertices that
  *         complete one 'thing' based on the drawing mode.
  *         ie, 2 for Lines, 3 for Triangles, etc.
  *  @return {WebGLBuffer}
  */
  function doBindAttribute(gl, attribute, bufferElems, elemSize) {
    var idxKeys = [];
    for (var i = 0; i < elemSize; i++) {
      idxKeys.push('_' + i);
    }

    function dataFill(data, cnt, fillOffset, elem, key) {
      if (elemSize === 1) {
        for (var i = 0; i < cnt; i++) {
          data[fillOffset++] = cnt === 1 ? elem[key] : elem[key][i];
        }
      } else {
        idxKeys.forEach(function (idx) {
          for (var i = 0; i < cnt; i++) {
            data[fillOffset++] = cnt === 1 ? elem[idx][key] : elem[idx][key][i];
          }
        });
      }
    }

    var attributeInfo = getAttributeInfo(gl, attribute.type);

    if (attributeInfo === undefined) {
      throw new Error('No info available for: ' + attribute.type);
    }

    var dataIdx = 0;
    var array = new attributeInfo.type(listLength(bufferElems) * attributeInfo.size * elemSize);

    listEach(function (elem) {
      dataFill(array, attributeInfo.size, dataIdx, elem, attribute.name);
      dataIdx += attributeInfo.size * elemSize;
    }, bufferElems);

    var buffer = gl.createBuffer();
    LOG('Created attribute buffer ' + attribute.name);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
    return buffer;
  }

 /**
  *  This sets up the binding caching buffers.
  *
  *  We don't actually bind any buffers now except for the indices buffer.
  *  The problem with filling the buffers here is that it is possible to
  *  have a buffer shared between two webgl shaders;
  *  which could have different active attributes. If we bind it here against
  *  a particular program, we might not bind them all. That final bind is now
  *  done right before drawing.
  *
  *  @param {WebGLRenderingContext} gl context
  *  @param {Object} renderType
  *  @param {Number} renderType.indexSize size of the index
  *  @param {Number} renderType.elemSize size of the element
  *  @param {Drawable} drawable a drawable object from Elm
  *         that contains elements and optionally indices
  *  @return {Object} buffer - an object with the following properties
  *  @return {Number} buffer.numIndices
  *  @return {WebGLBuffer} buffer.indexBuffer
  *  @return {Object} buffer.buffers - will be used to buffer attributes
  */
  function doBindSetup(gl, renderType, drawable) {
    LOG('Created index buffer');
    var indexBuffer = gl.createBuffer();
    var indices = (renderType.indexSize === 0)
      ? makeSequentialBuffer(renderType.elemSize * listLength(drawable._0))
      : makeIndexedBuffer(drawable._1, renderType.indexSize);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return {
      numIndices: indices.length,
      indexBuffer: indexBuffer,
      buffers: {}
    };
  }

 /**
  *  Create an indices array and fill it with 0..n
  *
  *  @param {Number} numIndices The number of indices
  *  @return {Uint16Array} indices
  */
  function makeSequentialBuffer(numIndices) {
    var indices = new Uint16Array(numIndices);
    for (var i = 0; i < numIndices; i += 1) {
      indices[i] = i;
    }
    return indices;
  }

 /**
  *  Create an indices array and fill it from indices
  *  based on the size of the index
  *
  *  @param {List} indicesList the list of indices
  *  @param {Number} indexSize the size of the index
  *  @return {Uint16Array} indices
  */
  function makeIndexedBuffer(indicesList, indexSize) {
    var indices = new Uint16Array(listLength(indicesList) * indexSize);
    var fillOffset = 0;
    var i;
    listEach(function (elem) {
      if (indexSize === 1) {
        indices[fillOffset++] = elem;
      } else {
        for (i = 0; i < indexSize; i++) {
          indices[fillOffset++] = elem['_' + i.toString()];
        }
      }
    }, indicesList);
    return indices;
  }

  function getProgID(vertID, fragID) {
    return vertID + '#' + fragID;
  }

  function drawGL(domNode, data) {

    var model = data.model;
    var gl = model.cache.gl;

    if (!gl) {
      return domNode;
    }

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    LOG('Drawing');

    function drawEntity(render) {
      if (listLength(render.buffer._0) === 0) {
        return;
      }

      var progid;
      var program;
      if (render.vert.id && render.frag.id) {
        progid = getProgID(render.vert.id, render.frag.id);
        program = model.cache.programs[progid];
      }

      if (!program) {

        var vshader;
        if (render.vert.id) {
          vshader = model.cache.shaders[render.vert.id];
        } else {
          render.vert.id = guid();
        }

        if (!vshader) {
          vshader = doCompile(gl, render.vert.src, gl.VERTEX_SHADER);
          model.cache.shaders[render.vert.id] = vshader;
        }

        var fshader;
        if (render.frag.id) {
          fshader = model.cache.shaders[render.frag.id];
        } else {
          render.frag.id = guid();
        }

        if (!fshader) {
          fshader = doCompile(gl, render.frag.src, gl.FRAGMENT_SHADER);
          model.cache.shaders[render.frag.id] = fshader;
        }

        program = doLink(gl, vshader, fshader);
        progid = getProgID(render.vert.id, render.frag.id);
        model.cache.programs[progid] = program;

      }

      gl.useProgram(program);

      progid = progid || getProgID(render.vert.id, render.frag.id);
      var setters = model.cache.uniformSetters[progid];
      if (!setters) {
        setters = createUniformSetters(gl, model, program);
        model.cache.uniformSetters[progid] = setters;
      }

      setUniforms(setters, render.uniforms);

      var renderType = getRenderInfo(gl, render.buffer.ctor);
      var buffer = model.cache.buffers[render.buffer.guid];

      if (!buffer) {
        buffer = doBindSetup(gl, renderType, render.buffer);
        model.cache.buffers[render.buffer.guid] = buffer;
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indexBuffer);

      var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

      for (var i = 0; i < numAttributes; i += 1) {
        var attribute = gl.getActiveAttrib(program, i);

        var attribLocation = gl.getAttribLocation(program, attribute.name);
        gl.enableVertexAttribArray(attribLocation);

        if (buffer.buffers[attribute.name] === undefined) {
          buffer.buffers[attribute.name] = doBindAttribute(gl, attribute, render.buffer._0, renderType.elemSize);
        }
        var attributeBuffer = buffer.buffers[attribute.name];
        var attributeInfo = getAttributeInfo(gl, attribute.type);

        listEach(function (functionCall) {
          functionCall(gl);
        }, render.functionCalls);

        gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer);
        gl.vertexAttribPointer(attribLocation, attributeInfo.size, attributeInfo.baseType, false, 0, 0);
      }
      gl.drawElements(renderType.mode, buffer.numIndices, gl.UNSIGNED_SHORT, 0);

    }

    listEach(drawEntity, model.renderables);
    return domNode;
  }

  function createUniformSetters(gl, model, program) {

    var textureCounter = 0;
    function createUniformSetter(program, uniform) {
      var uniformLocation = gl.getUniformLocation(program, uniform.name);
      switch (uniform.type) {
        case gl.INT:
          return function (value) {
            gl.uniform1i(uniformLocation, value);
          };
        case gl.FLOAT:
          return function (value) {
            gl.uniform1f(uniformLocation, value);
          };
        case gl.FLOAT_VEC2:
          return function (value) {
            gl.uniform2fv(uniformLocation, value);
          };
        case gl.FLOAT_VEC3:
          return function (value) {
            gl.uniform3fv(uniformLocation, value);
          };
        case gl.FLOAT_VEC4:
          return function (value) {
            gl.uniform4fv(uniformLocation, value);
          };
        case gl.FLOAT_MAT4:
          return function (value) {
            gl.uniformMatrix4fv(uniformLocation, false, value);
          };
        case gl.SAMPLER_2D:
          var currentTexture = textureCounter;
          var activeName = 'TEXTURE' + currentTexture;
          textureCounter += 1;
          return function (value) {
            var texture = value;
            var tex = undefined;
            if (texture.id) {
              tex = model.cache.textures[texture.id];
            } else {
              texture.id = guid();
            }
            if (!tex) {
              tex = doTexture(gl, texture);
              model.cache.textures[texture.id] = tex;
            }
            gl.activeTexture(gl[activeName]);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.uniform1i(uniformLocation, currentTexture);
          };
        case gl.BOOL:
          return function (value) {
            gl.uniform1i(uniformLocation, value);
          };
        default:
          LOG('Unsupported uniform type: ' + uniform.type);
          return function () {};
      }
    }

    var uniformSetters = {};
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < numUniforms; i += 1) {
      var uniform = gl.getActiveUniform(program, i);
      uniformSetters[uniform.name] = createUniformSetter(program, uniform);
    }

    return uniformSetters;
  }

  function setUniforms(setters, values) {
    Object.keys(values).forEach(function (name) {
      var setter = setters[name];
      if (setter) {
        setter(values[name]);
      }
    });
  }

  // VIRTUAL-DOM WIDGET

  function toHtml(options, functionCalls, factList, renderables) {
    var model = {
      functionCalls: functionCalls,
      renderables: renderables,
      cache: {},
      // filter out context attributes from options 
      contextAttributes: {
        alpha: options.alpha,
        depth: options.depth,
        stencil: options.stencil,
        antialias: options.antialias,
        premultipliedAlpha: options.premultipliedAlpha
      }
    };
    // eslint-disable-next-line camelcase
    return _elm_lang$virtual_dom$Native_VirtualDom.custom(factList, model, implementation);
  }

  var implementation = {
    render: renderCanvas,
    diff: diff
  };

  /**
   *  Creates canvas and schedules initial drawGL
   *  @param {Object} model
   *  @param {Object} model.cache that may contain the following properties:
             gl, shaders, programs, uniformSetters, buffers, textures
   *  @param {List} model.functionCalls
   *  @param {List} model.renderables
   *  @return {HTMLElement} <canvas> if WebGL is supported, otherwise a <div>
   */
  function renderCanvas(model) {

    LOG('Render canvas');
    var canvas = document.createElement('canvas');
    var gl = canvas.getContext && (canvas.getContext('webgl', model.contextAttributes) || canvas.getContext('experimental-webgl', model.contextAttributes));

    if (gl) {
      listEach(function (functionCall) {
        functionCall(gl);
      }, model.functionCalls);
    } else {
      canvas = document.createElement('div');
      canvas.innerHTML = '<a href="http://get.webgl.org/">Enable WebGL</a> to see this content!';
    }

    model.cache.gl = gl;
    model.cache.shaders = [];
    model.cache.programs = {};
    model.cache.uniformSetters = {};
    model.cache.buffers = [];
    model.cache.textures = [];

    // Render for the first time.
    // This has to be done in animation frame,
    // because the canvas is not in the DOM yet,
    // when renderCanvas is called by virtual-dom
    rAF(function () {
      drawGL(canvas, {model: model});
    });

    return canvas;
  }


  function diff(oldModel, newModel) {
    newModel.model.cache = oldModel.model.cache;
    return {
      applyPatch: drawGL,
      data: newModel
    };
  }

  return {
    unsafeCoerceGLSL: unsafeCoerceGLSL,
    render: F5(render),
    toHtml: F4(toHtml)
  };

}();
