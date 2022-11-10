import {defs, tiny} from './examples/common.js';
import {Block, block_materials, block_colors} from './block.js';
import {tetrominoes} from './tetromino.js';
import {Field_Outline} from "./field_outline.js";
//import {Block_shader} from "./block_shader";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

//Size of the map
const MAX_LEVEL = 8;
const MAX_ROW = 6;
const MAX_COL = 6;

// Main class for the game
export class Beyond_Tetris extends Scene {
    constructor() {
        super();

        // Initialize the value of this.block_map
        this.initialize_map();

        // Record the current active piece as array of 4 blocks position [[x, y, z], [], [], []]
        this.current = 1;
        this.current_pos = vec3(MAX_ROW / 2, MAX_LEVEL, MAX_COL / 2);

        this.shapes = {
            'block': new Block(),
            'outline': new Field_Outline(),
        };

        this.materials = block_materials;
        this.white = new Material(new defs.Basic_Shader());

        this.direction = null;

        // generate a look at matrix with input eye position, center of interest, and up vector
        this.initial_camera_location = Mat4.look_at(vec3(10, 25, 15), vec3(0, 8, 0), vec3(0, 1, 0));
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
        
        // the highest point in current block map
        this.highest = 0;
        this.gameOver = false;
    }

    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    make_control_panel() {
        this.key_triggered_button("restart", ["c"], () => {});
        this.new_line();
        this.key_triggered_button("Move forward", ["s"], () => {this.direction = "forward"});
        this.key_triggered_button("Move backward", ["w"], () => {this.direction = "backward"});
        this.key_triggered_button("Move Left", ["a"], () => {this.direction = "left"});
        this.key_triggered_button("Move right", ["d"], () => {this.direction = "right"});
        this.key_triggered_button("Reset", ["Control", "r"], () => {this.initialize_map()});
    }

    // Detect collisions between tetrominoes
    detect_collision() {
        let lowest = Math.floor(this.current_pos[1]) - tetrominoes[this.current].depth;
        //console.log(lowest)
        if (lowest <= this.highest+1 && lowest > 0) {
            // traverse through all the blocks in the current tetromino
            for (let blockIndex = 0; blockIndex < 4; blockIndex ++) {
                // traverse through all the levels in the block map
                let block = tetrominoes[this.current].blocks[blockIndex];
                let curr_row = this.current_pos[2] + block[2];
                // have to add 0.9 so that the function only return true when two blocks are 0.1 distance apart
                // can't think a better solution right not that can return true when the two blocks are entirely stick together
                // Can be improved later
                let curr_depth = Math.floor(this.current_pos[1]+0.9) + block[1];
                let curr_col = this.current_pos[0] + block[0];
                // if there's a block in block map right below this current block, return true
                if(this.block_map[curr_depth-1][curr_row][curr_col] !== 0) {
                    if (curr_depth >= 7) {
                        // call game over function
                        this.gameOver = true;
                    }
                    return true;
                }
            }
        }
        return false;
    }

    // Main display function in Beyond_Tetris class.
    // Set up the camera, lighting, and draw everything
    display(context, program_state) {
        if (this.gameOver) {
            return
        }

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
        model_transform_outline = model_transform_outline.times(Mat4.translation(-1, 7, -1))
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

        // reset when block collide or hit the bottom
        if (this.detect_collision() || this.current_pos[1] - tetrominoes[this.current].depth <= 0) {
            // place the tetromino into block map
            for (let blockIndex = 0; blockIndex < 4; blockIndex ++) {
                let block = tetrominoes[this.current].blocks[blockIndex];
                let curr_row = this.current_pos[2] + block[2];
                let curr_depth = 0;
                // if the the reset is triggered by hitting the bottom, it's vertical depth would be smaller than
                // zero at this point, which make calling math.floor return -1. Then the tetromino would be placed 
                // wrongly in the block map. Therefore i differentiate the two conditions here. 
                // Can be improved later.
                if (this.current_pos[1] - tetrominoes[this.current].depth <= 0 ) {
                    curr_depth = Math.ceil(this.current_pos[1]) + block[1];
                }
                else {
                    curr_depth = Math.floor(this.current_pos[1]) + block[1];
                }
                let curr_col = this.current_pos[0] + block[0];
                // place the blocks in block map 
                this.block_map[curr_depth >= 0 ? curr_depth : 0][curr_row][curr_col] = this.current;
                if (curr_depth > this.highest) {
                    this.highest = curr_depth;
                }
            }

            this.current = Math.floor(Math.random() * (8 - 1 + 1) + 1);
            this.current_pos = vec3(MAX_ROW / 2, MAX_LEVEL, MAX_COL / 2);
        }

        // change the position of current tetromino by calling its fall method
        this.current_pos = tetrominoes[this.current].fall(this.current_pos);
        if (this.direction != null) {
            // move the tetromino according to the keyboard input
            this.current_pos = tetrominoes[this.current].move(this.current_pos, this.direction);
            this.direction = null;
        }
        
        tetrominoes[this.current].display(this.current_pos, this, context, program_state, init_transform);
    }
}