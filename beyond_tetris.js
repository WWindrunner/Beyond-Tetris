import {defs, tiny} from './examples/common.js';
import {Block, block_materials, block_colors} from './block.js';
import {tetrominoes} from './tetromino.js';
import {Field_Outline} from "./field_outline.js";
//import {Block_shader} from "./block_shader";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

//Size of the map
const MAX_LEVEL = 10;
const MAX_ROW = 6;
const MAX_COL = 6;
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
        this.current = tetrominoes[1].copy(TETROMINO_SPAWN_POS);
        this.next_tetromino = tetrominoes[Math.floor(Math.random() * (8 - 1 + 1) + 1)].copy(NEXT_TETROMINO_POS);
        this.tetromino_projection = null;
        this.speed = 0.012;
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
        this.initial_camera_location = Mat4.look_at(vec3(0, MAX_LEVEL, 30), vec3(0, MAX_LEVEL, 0), vec3(0, 1, 0));
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
        this.key_triggered_button("Move Down", ["x"], () => {this.speed_mult = 25});
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

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
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

        // Display all blocks in the block_map
        for (let level = 0; level < MAX_LEVEL; level++) {
            for (let row = 0; row < MAX_ROW; row++) {
                for (let col = 0; col < MAX_COL; col++) {
                    if (this.block_map[level][row][col] !== 0) {
                        this.shapes.block.draw(context, program_state, model_transform,
                            this.materials.plastic.override({color: block_colors[this.block_map[level][row][col]]}));
                    }
                    model_transform = model_transform.times(Mat4.translation(2, 0, 0));
                }
                model_transform = model_transform.times(Mat4.translation(-2 * MAX_COL, 0, 2));
            }
            model_transform = model_transform.times(Mat4.translation(0, 2, -2 * MAX_ROW));
        }

        const curr_speed = this.speed * this.speed_mult;
        this.speed_mult = 1.0;
        
        // reset when block collide or hit the bottom
        if (this.current && this.current.detect_collision(this, curr_speed)) {
            // place the tetromino into block map
            console.log("Placed blocks!");
            this.current.place_blocks(this);
            this.current = this.next_tetromino.copy(TETROMINO_SPAWN_POS);
            this.next_tetromino = tetrominoes[Math.floor(Math.random() * (8 - 1 + 1) + 1)].copy(NEXT_TETROMINO_POS);
            this.speed += 0.001;
            if (this.speed > 0.5)
                this.speed = 0.5;
            if (!this.current.check_collision(this)) {
                this.current = null;
                this.game_over = true;
                console.log("Game Over!");
            }
        }

        if (this.current !== null) {
            // change the position of current tetromino by calling its fall method
            this.current.fall(curr_speed);
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

            this.tetromino_projection.display(this, context, program_state, init_transform);
            this.next_tetromino.display(this, context, program_state, init_transform);
            this.current.display(this, context, program_state, init_transform);
        }
    }
}