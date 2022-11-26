import {defs, tiny} from './examples/common.js';
import {Block, block_materials, block_colors} from './block.js';
import {tetrominoes} from './tetromino.js';
import {Field_Outline} from "./field_outline.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
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

        this.shapes = {
            'block': new Block(),
            'outline': new Field_Outline(),
        };

        this.materials = block_materials;
        this.white = new Material(new defs.Basic_Shader());

        this.direction = null;
        this.rotation = null;

        // generate a look at matrix with input eye position, center of interest, and up vector
        this.initial_camera_location = Mat4.look_at(vec3(0, MAX_LEVEL, MAX_LEVEL * 3), vec3(0, MAX_LEVEL, 0), vec3(0, 1, 0));
        this.first_frame = true;
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
    }

    // Main display function in Beyond_Tetris class.
    // Set up the camera, lighting, and draw everything
    display(context, program_state) {
        // if (this.game_over) {
        //     return
        // }

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

            this.first_frame = false;
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // Lights: Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        // draw the outline
        let model_transform_outline = Mat4.identity();
        model_transform_outline = model_transform_outline.times(Mat4.translation(-1, MAX_LEVEL - 1, -1))
                                                         .times(Mat4.scale(MAX_ROW, MAX_LEVEL, MAX_COL));
        this.shapes.outline.draw(context, program_state, model_transform_outline, this.white, "LINES")
        
        let model_transform = Mat4.identity();
        this.t = program_state.animation_time;
        //this.shapes.block.draw(context, program_state, model_transform, this.materials.plastic);

        const init_transform = model_transform.times(Mat4.translation(-1 * MAX_ROW, 0, -1 * MAX_COL));
        model_transform = init_transform;

        let raycast = undefined;
      
        // Display all blocks in the block_map
        for (let level = 0; level < MAX_LEVEL; level++) {
            for (let row = 0; row < MAX_ROW; row++) {
                for (let col = 0; col < MAX_COL; col++) {
                    if (this.block_map[level][row][col] !== 0) {
                        // let transparency = row - this.current.get_depth();
                        // if (transparency < 0) transparency = 0;
                        // transparency = transparency / 4;
                        // console.log(transparency);

                        // Draw block
                        this.shapes.block.draw(context, program_state, model_transform,
                            this.materials.transparent.override({
                                color: block_colors[this.block_map[level][row][col]],
                                ambient: this.materials.plastic.ambient,
                                diffusivity: this.materials.plastic.diffusivity,
                                specularity: 0,
                                transparency: 0,
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

        if (raycast === undefined && this.mouse_position) {
            const PCM = program_state.projection_transform.times(program_state.camera_inverse).times(init_transform);
            const PCM_inv = Mat4.inverse(PCM);
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
            // place the tetromino into block map
            console.log("Placed blocks!");
            this.current.place_blocks(this);
            this.current = this.next_tetromino.copy(TETROMINO_SPAWN_POS);
            this.current.position = this.current.fix_bounds(this.num_rows, this.num_cols);
            this.next_tetromino = tetrominoes[Math.floor(Math.random() * (8 - 1 + 1) + 1)].copy(NEXT_TETROMINO_POS);
            this.speed += 0.0005;
            if (this.speed > 0.5)
                this.speed = 0.5;
            if (!this.current.check_collision(this)) {
                console.log("Game Over!");
                console.log(this.current);
                this.current = null;
                this.game_over = true;
            }
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

            // Predict and show where the tetromino will fall
            this.tetromino_projection = this.current.get_projection_tetromino(this);

            this.current.display(this, context, program_state, init_transform);
            this.tetromino_projection.display(this, context, program_state, init_transform, true);
            this.next_tetromino.display(this, context, program_state, init_transform);
        }
    }

    detect_raycast(program_state, model_transform, closest_cast, margin=0.01) {
        if (this.mouse_position) {
            // const projection_camera_matrix = ;
            const PCM = program_state.projection_transform.times(program_state.camera_inverse).times(model_transform);
            const PCM_inv = Mat4.inverse(PCM);
            const PCM_normal = Mat4.inverse(PCM.transposed());

            for (let i = 0; i < 6; i++) {
                let face_pos = PCM.times(this.shapes.block.face_positions[i].to4(1));
                let face_norm = PCM_normal.times(this.shapes.block.face_normals[i].to4(0));

                face_pos.scale_by(1/face_pos[3]);
                face_norm = face_norm.to3().normalized();
                // console.log(face_norm);

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