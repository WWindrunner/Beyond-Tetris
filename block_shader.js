import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Block_Shader extends defs.Textured_Phong {
    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
                uniform float transparency;
                varying vec2 f_tex_coord;
                
                void main(){
                    
                    if (f_tex_coord.x < 0.05 || f_tex_coord.x > 0.95 || f_tex_coord.y < 0.05 || f_tex_coord.y > 0.95)
                        gl_FragColor = vec4(vec3(0.1, 0.1, 0.1), 1.0 - transparency);
                    else
                        // Compute an initial (ambient) color:
                        gl_FragColor = vec4( shape_color.xyz * ambient, 1.0 - transparency );
                    // Compute the final color with contributions from lights:
                    gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                    
                  } `;
    }

    send_material(gl, gpu, material) {
        super.send_material(gl, gpu, material);
        gl.uniform1f(gpu.transparency, material.transparency);
    }
}

export {Block_Shader};