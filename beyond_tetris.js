import {defs, tiny} from './examples/common.js';
import {Block, block_materials, block_colors} from './block.js';
import {tetrominoes} from './tetromino.js';
import {Field_Outline} from "./field_outline.js";
import {Text_Line} from "./examples/text-demo.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Texture, Scene,
} = tiny;

//Size of the map
const MAX_LEVEL = 15;
const MAX_ROW = 4;
const MAX_COL = 4;
const TETROMINO_SPAWN_POS = vec3(MAX_ROW/2, MAX_LEVEL-1, MAX_COL/2);
const NEXT_TETROMINO_POS = vec3(MAX_ROW*1.5, MAX_LEVEL/2, MAX_COL/2);

// Main class for the game
export class Beyond_Tetris extends Scene {
    constructor() {
        super();

        // Initialize the value of this.block_map
        this.num_rows = MAX_ROW;
        this.num_cols = MAX_COL;
        this.num_levels = MAX_LEVEL;
        this.initialize_map();

        // Record the current active piece as array of 4 blocks position [[x, y, z], [], [], []]
        // this.current = null;
        this.current = tetrominoes[1].copy(TETROMINO_SPAWN_POS);
        this.current.position = this.current.fix_bounds(MAX_ROW, MAX_COL);
        this.next_tetromino = tetrominoes[Math.floor(Math.random() * (8 - 1 + 1) + 1)].copy(NEXT_TETROMINO_POS);
        this.tetromino_projection = null;
        this.speed = 0.01;
        this.speed_mult = 1.0;
        this.score = 0;
        this.num_particles = 100;
        this.particle_duration = 0.7;

        this.shapes = {
            'block': new Block(),
            'outline': new Field_Outline(),
            'text': new Text_Line(35),
            'particle': new particle(this.num_particles)
        };

        // For text display
        this.text_image = new Material(new defs.Textured_Phong(1), {
            ambient: 1, diffusivity: 0, specularity: 0,
            texture: new Texture("assets/text.png")
        });
        // For outline and block display
        this.white = new Material(new defs.Basic_Shader());
        this.materials = block_materials;
        this.particle_material = new Material(new Particles_Shader(), {
            color: hex_color("#80290b"), ambient: 0.2, diffusivity: 1, specularity: 1});

        this.direction = null;
        this.rotation = null;

        // generate a look at matrix with input eye position, center of interest, and up vector
        this.initial_camera_location = Mat4.look_at(vec3(0, MAX_LEVEL, MAX_LEVEL * 3), vec3(0, MAX_LEVEL, 0), vec3(0, 1, 0));
        this.first_frame = true;

        // generate particles once a level is cleared
        this.show_particles = false;
    }

    // Initialize the block_map, set all values to 0
    initialize_map() {
        // this.block_map records all blocks in the scene
        this.block_map = new Array(MAX_LEVEL);
        for (let level = 0; level < MAX_LEVEL; level++) {
            let each_l = new Array(MAX_ROW);
            for (let row = 0; row < MAX_ROW; row++) {
                let each_r = new Array(MAX_COL);
                for (let col = 0; col < MAX_COL; col++) {
                    each_r[col] = 0;
                }
                each_l[row] = each_r;
            }
            this.block_map[level] = each_l;
        }

        //For testing
        // this.block_map[0][0][0] = 1;
        // this.block_map[0][2][0] = 3;
        // this.block_map[0][3][3] = 3;
        // this.block_map[1][3][3] = 3;
        // this.block_map[2][3][3] = 3;
        // this.block_map[3][3][3] = 3;
        // this.block_map[0][3][4] = 2;
        // this.block_map[1][3][4] = 2;
        // this.block_map[2][3][4] = 2;
        // this.block_map[3][3][4] = 2;
        // this.block_map[0][MAX_ROW - 1][MAX_COL - 1] = 4;
        this.game_over = false;
    }

    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    make_control_panel() {
        // this.key_triggered_button("restart", ["c"], () => {});
        this.new_line();
        this.key_triggered_button("Move Forward", ["s"], () => {this.direction = vec3(0, 0, 1)});
        this.key_triggered_button("Move Backward", ["w"], () => {this.direction = vec3(0, 0, -1)});
        this.key_triggered_button("Move Left", ["a"], () => {this.direction = vec3(-1, 0, 0)});
        this.key_triggered_button("Move Right", ["d"], () => {this.direction = vec3(1, 0, 0)});
        this.key_triggered_button("Move Down", ["x"], () => {this.speed_mult = 25}, undefined, () => this.speed_mult = 1.0);
        this.new_line();
        this.key_triggered_button("Rotate Z-axis", ["q"], () => this.rotation = vec3(0, 0, 1));
        this.key_triggered_button("Rotate X-axis", ["e"], () => this.rotation = vec3(1, 0, 0));
        this.key_triggered_button("Rotate Y-axis", ["r"], () => this.rotation = vec3(0, 1, 0));
        this.new_line();
        this.key_triggered_button("Reset", ["Control", "r"], () => {this.initialize_map()});
        this.new_line();
        // For testing, some cheat keys to use
        this.key_triggered_button("Cheat level 0", ["1"], () => {
            for (let row = 0; row < MAX_ROW; row++) {
                for (let col = 0; col < MAX_COL; col++) {
                    this.block_map[0][row][col] = (row + col) % 8 + 1;
                }
            }
            this.block_map[0][MAX_ROW - 1][MAX_COL - 1] = 0;
        });
        this.key_triggered_button("Cheat level 1", ["2"], () => {
            for (let row = 0; row < MAX_ROW; row++) {
                for (let col = 0; col < MAX_COL; col++) {
                    this.block_map[1][row][col] = (row + col) % 2 + 1;
                }
            }
            this.block_map[1][MAX_ROW - 1][MAX_COL - 1] = 0;
        });
        this.key_triggered_button("Cheat level 3", ["3"], () => {
            for (let row = 0; row < MAX_ROW; row++) {
                for (let col = 0; col < MAX_COL; col++) {
                    this.block_map[3][row][col] = (row + col) % 4 + 1;
                }
            }
            this.block_map[3][MAX_ROW - 1][MAX_COL - 1] = 0;
        });
    }

    // Check each level if it is filled with blocks.
    // If filled, call remove_level() on that level.
    check_level_filled() {
        for (let level = 0; level < MAX_LEVEL; level++) {
            let is_filled = true;
            for (let row = 0; row < MAX_ROW; row++) {
                for (let col = 0; col < MAX_COL; col++) {
                    if (this.block_map[level][row][col] === 0) {
                        is_filled = false;
                        break;
                    }
                }
                if (!is_filled) {
                    break;
                }
            }
            if (is_filled) {
                this.remove_level(level);
                this.score += 10;
                level--;
            }
        }
    }

    // Remove all blocks in block_map[index], then move all
    // blocks above 1 unit down
    // TODO: maybe we can add particle effects here
    remove_level(index) {
        for (let row = 0; row < MAX_ROW; row++) {
            for (let col = 0; col < MAX_COL; col++) {
                this.block_map[index][row][col] = 0;
            }
        }
        for (let level = index; level < MAX_LEVEL; level++) {
            for (let row = 0; row < MAX_ROW; row++) {
                for (let col = 0; col < MAX_COL; col++) {
                    if (level === MAX_LEVEL - 1) {
                        this.block_map[level][row][col] = 0;
                    }
                    else {
                        this.block_map[level][row][col] = this.block_map[level + 1][row][col];
                    }
                }
            }
        }

        // begin particle generation
        this.show_particles = true;
    }

    // Main display function in Beyond_Tetris class.
    // Set up the camera, lighting, and draw everything.
    display(context, program_state) {
        if (this.first_frame) {
            // this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
            let canvas = context.canvas;
            const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
                vec((e.clientX - (rect.left + rect.right) / 2) / ((rect.right - rect.left) / 2),
                    (e.clientY - (rect.bottom + rect.top) / 2) / ((rect.top - rect.bottom) / 2));

            canvas.addEventListener("mousemove", e => {
                e.preventDefault();
                this.mouse_position = mouse_position(e);
            });
            canvas.addEventListener("mousedown", e => {
                e.preventDefault();
                this.current.position = this.tetromino_projection.position;
                this.drop_blocks();
            });

            this.first_frame = false;
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        let dt = program_state.animation_delta_time / 1000;
        // Lights: Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        // Draw the outline
        let model_transform_outline = Mat4.identity();
        model_transform_outline = model_transform_outline.times(Mat4.translation(-1, MAX_LEVEL - 1, -1))
                                                         .times(Mat4.scale(MAX_ROW, MAX_LEVEL, MAX_COL));
        this.shapes.outline.draw(context, program_state, model_transform_outline, this.white, "LINES");
        
        let model_transform = Mat4.identity();
        let particle_transform = Mat4.identity();
        const init_transform = model_transform.times(Mat4.translation(-1 * MAX_ROW, 0, -1 * MAX_COL));
        model_transform = init_transform;

        let raycast = undefined;

        this.draw_text(context, program_state);

        if (this.current !== null) {
            // Predict and show where the tetromino will fall
            this.tetromino_projection = this.current.get_projection_tetromino(this);

            this.current.display(this, context, program_state, init_transform);
            this.tetromino_projection.display(this, context, program_state, init_transform, true);
            this.next_tetromino.display(this, context, program_state, init_transform);
        }
    
        // Display all blocks in the block_map
        for (let level = 0; level < MAX_LEVEL; level++) {
            for (let row = 0; row < MAX_ROW; row++) {
                for (let col = 0; col < MAX_COL; col++) {
                    if (this.block_map[level][row][col] !== 0) {
                        let transparency = 0;
                        if (row > this.current.get_depth())
                            transparency = 0.9;

                        // Draw block
                        this.shapes.block.draw(context, program_state, model_transform,
                            this.materials.block_mat.override({
                                color: block_colors[this.block_map[level][row][col]],
                                ambient: this.materials.plastic.ambient,
                                diffusivity: this.materials.plastic.diffusivity,
                                specularity: 0,
                                transparency: transparency,
                            }));
                        
                        // Detect raycast with mouse
                        raycast = this.detect_raycast(program_state, model_transform, raycast);
                    }
                    model_transform = model_transform.times(Mat4.translation(2, 0, 0));
                }
                model_transform = model_transform.times(Mat4.translation(-2 * MAX_COL, 0, 2));
            }
            model_transform = model_transform.times(Mat4.translation(0, 2, -2 * MAX_ROW));
        }

        // generate particles
        if (this.show_particles) {
            particle_transform = particle_transform.times(Mat4.translation(-5, -5, -5));
            // move the particles downward by subtracting the offset array, which is 
            // later fed into the shader to generate particles.
            this.shapes.particle.arrays.offset = this.shapes.particle.arrays.offset.map(x => x.minus(vec3(0, 0.1, 0)));
            this.shapes.particle.draw(context, program_state, particle_transform, this.particle_material); 
            this.shapes.particle.copy_onto_graphics_card(context.context, ["offset"], false);
            this.particle_duration -= dt;
            if (this.particle_duration <= 0) {
                this.particle_duration = 0.7;
                this.show_particles = false;
            }
        }

        if (raycast === undefined && this.mouse_position) {
            const PCM = program_state.projection_transform.times(program_state.camera_inverse).times(init_transform);
            const PCM_normal = Mat4.inverse(PCM.transposed());
            
            let floor_pos = PCM.times(vec4(0, 0, 0, 1));
            let floor_norm = PCM_normal.times(vec4(0, 1, 0, 0));

            floor_pos.scale_by(1/floor_pos[3]);
            floor_norm = floor_norm.to3().normalized();

            if (Math.abs(floor_norm[2]) > 0.01) {
                const z = (floor_norm.dot(floor_pos.to3()) - floor_norm[0] * this.mouse_position[0] - floor_norm[1] * this.mouse_position[1]) / floor_norm[2];
                if (z <= 1 && z >= 0) {
                    raycast = vec3(this.mouse_position[0], this.mouse_position[1], z);
                }
            }
        }

        const curr_speed = this.speed * this.speed_mult;
        // this.speed_mult = 1.0;
        
        // reset when block collide or hit the bottom
        if (this.current && this.current.detect_collision(this, curr_speed)) {
            this.drop_blocks();
        }

        if (this.current !== null) {
            // change the position of current tetromino by calling its fall method
            this.current.fall(curr_speed);

            if (raycast){
                const projection_camera_matrix = program_state.projection_transform.times(program_state.camera_inverse);
                raycast[2] -= 0.001
                let world_raycast = Mat4.inverse(projection_camera_matrix).times(raycast.to4(1));
                world_raycast.scale_by(1/world_raycast[3]);
                world_raycast = world_raycast.plus(vec4(MAX_COL, 0, MAX_ROW, 0));
                world_raycast.scale_by(1/2);
                const x = Math.round(world_raycast[0])
                const z = Math.round(world_raycast[2]);
                if (x >= 0 && x < MAX_COL && z >= 0 && z <= MAX_ROW) {
                    let new_pos = vec3(x, this.current.position[1], z);
                    new_pos = this.current.fix_bounds(MAX_ROW, MAX_COL, new_pos);
                    if (this.current.check_collision(this, new_pos))
                        this.current.position = new_pos;
                }
            }
            if (this.direction !== null) {
                // move the tetromino according to the keyboard input
                this.current.move(this.direction, this);
                this.direction = null;
            }
            if (this.rotation !== null) {
                this.current.rotate(this, this.rotation);
                this.rotation = null;
            }
        }

        this.mouse_position = null;
    }

    drop_blocks() {
        // place the tetromino into block map
        console.log("Placed blocks!");
        this.current.place_blocks(this);
        this.current = this.next_tetromino.copy(TETROMINO_SPAWN_POS);
        this.current.position = this.current.fix_bounds(this.num_rows, this.num_cols);
        this.next_tetromino = tetrominoes[Math.floor(Math.random() * (8 - 1 + 1) + 1)].copy(NEXT_TETROMINO_POS);

        // For testing, disable speed increase to make it easier
        this.speed += 0.0001;
        if (this.speed > 0.3)
        this.speed = 0.3;

        // Check and remove filled levels
        this.check_level_filled();
        if (!this.current.check_collision(this)) {
            console.log("Game Over!");
            console.log(this.current);
            this.current = null;
            this.game_over = true;
        }
        this.score++;
    }

    draw_text(context, program_state) {
        // Write score and next block text
        let text_transform = Mat4.identity();
        text_transform = text_transform.times(Mat4.scale(NEXT_TETROMINO_POS[0], NEXT_TETROMINO_POS[1], NEXT_TETROMINO_POS[2]))
                                        .times(Mat4.translation(0.8, 3, 0));
        //console.log(text_transform);
        this.shapes.text.set_string("Your Score: " + this.score, context.context);
        this.shapes.text.draw(context, program_state,
            text_transform.times(Mat4.scale(.06, .1, .1)), this.text_image);
        // Move our basis down a line.
        text_transform.post_multiply(Mat4.translation(0, -.5, 0));
        if (this.game_over) {
            this.shapes.text.set_string("Game Over!", context.context);
            this.shapes.text.draw(context, program_state,
                text_transform.times(Mat4.scale(.06, .1, .1)), this.text_image);
        }
        else {
            this.shapes.text.set_string("Next Piece: ", context.context);
            this.shapes.text.draw(context, program_state,
                text_transform.times(Mat4.scale(.06, .1, .1)), this.text_image);
        }
    }

    detect_raycast(program_state, model_transform, closest_cast, margin=0.01) {
        if (this.mouse_position) {
            const PCM = program_state.projection_transform.times(program_state.camera_inverse).times(model_transform);
            const PCM_inv = Mat4.inverse(PCM);
            const PCM_normal = Mat4.inverse(PCM.transposed());

            for (let i = 0; i < 6; i++) {
                let face_pos = PCM.times(this.shapes.block.face_positions[i].to4(1));
                let face_norm = PCM_normal.times(this.shapes.block.face_normals[i].to4(0));

                face_pos.scale_by(1/face_pos[3]);
                face_norm = face_norm.to3().normalized();

                if (Math.abs(face_norm[2]) < margin)
                    continue;

                const z = (face_norm.dot(face_pos.to3()) - face_norm[0] * this.mouse_position[0] - face_norm[1] * this.mouse_position[1]) / face_norm[2];
                if (z > 1 || z < 0)
                    continue;

                const raycast = vec3(this.mouse_position[0], this.mouse_position[1], z);
                const model_pos = PCM_inv.times(raycast.to4(1));
                model_pos.scale_by(1/model_pos[3]);

                // console.log(face_pos, face_norm, raycast, model_pos, model_transform, PCM_normal);

                if (model_pos[0] > 1 + margin || model_pos[0] < -1 - margin|| 
                    model_pos[1] > 1 + margin || model_pos[1] < -1 - margin||
                    model_pos[2] > 1 + margin || model_pos[2] < -1 - margin)
                    continue;

                if (raycast && (closest_cast == undefined || raycast[2] < closest_cast[2])) {
                    // console.log(face_pos, face_norm, model_pos, raycast, model_transform, PCM, PCM_normal);
                    // console.log(model_pos, raycast);
                    closest_cast = raycast;
                }
            }
       }
       return closest_cast;
    }
}
class particle extends Shape {
        constructor(num_particles) {
            super("position", "normal", "texture_coord", "offset");
            for (let i = 0; i < num_particles; i++) {
                // combine all particles into one shape
                defs.Square.insert_transformed_copy_into(this, [9], Mat4.identity());
            }
            // randomize the initial position of particles
            const offsets = Array(num_particles).fill(0).map(x=>vec3(4,-4,4).randomized(8));
            // map each offset to four vertext positions for the entire shape
            this.arrays.offset = this.arrays.position.map((x, i)=> offsets[Math.floor(i/4)]);
        }
    };
class Particles_Shader extends defs.Phong_Shader {
        // **Textured_Phong** is a Phong Shader extended to addditionally decal a
        // texture image over the drawn shape, lined up according to the texture
        // coordinates that are stored at each shape vertex.
        vertex_glsl_code() {
            // ********* VERTEX SHADER *********
            return this.shared_glsl_code() + `
                varying vec2 f_tex_coord;
                attribute vec3 position, normal, offset;                            
                // Position is expressed in object coordinates.
                attribute vec2 texture_coord;
                
                uniform mat4 model_transform;
                uniform mat4 projection_camera_model_transform;
                
                void main(){                                                                   
                    // Change the texture position based on offset (Move the particles)
                    vec3 temp = offset;
                    temp[1] = mod(temp[1], 4.0);
                    gl_Position = projection_camera_model_transform * vec4(position + temp, 1.0 );
                    // The final normal vector in screen space.
                    N = normalize( mat3( model_transform ) * normal / squared_scale);
                    vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                    // Turn the per-vertex texture coordinate into an interpolated variable.
                    f_tex_coord = texture_coord;
                  } `;
        }

        fragment_glsl_code() {
            // ********* FRAGMENT SHADER *********
            // A fragment is a pixel that's overlapped by the current triangle.
            // Fragments affect the final image or get discarded due to depth.
            return this.shared_glsl_code() + `
                varying vec2 f_tex_coord;
                uniform sampler2D texture;
                uniform float animation_time;
                
                void main(){
                    // Sample the texture image in the correct place:
                    vec4 tex_color = vec4(0.05/(distance(f_tex_coord, vec2(.5,.5))));
                    if( tex_color.w < .7 ) discard;
                                                                             // Compute an initial (ambient) color:
                    gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                             // Compute the final color with contributions from lights:
                    gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                  } `;
        }

        update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
            // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
            // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
            // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
            // program (which we call the "Program_State").  Send both a material and a program state to the shaders
            // within this function, one data field at a time, to fully initialize the shader for a draw.
    
            // Fill in any missing fields in the Material object with custom defaults for this shader:
            const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
            material = Object.assign({}, defaults, material);
    
            this.send_material(context, gpu_addresses, material);
            this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
        }
    }