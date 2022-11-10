import {defs, tiny} from './examples/common.js';
import {Block, block_materials, block_colors} from './block.js';
import {tetrominoes} from './tetromino.js';
//import {Block_shader} from "./block_shader";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

//Size of the map
const MAX_LEVEL = 8;
const MAX_ROW = 6;
const MAX_COL = 6;

class Cube_Outline extends Shape {
    constructor() {
        super("position", "color");
        //  TODO (Requirement 5).
        // When a set of lines is used in graphics, you should think of the list entries as
        // broken down into pairs; each pair of vertices will be drawn as a line segment.
        // Note: since the outline is rendered with Basic_shader, you need to redefine the position and color of each vertex
        this.arrays.position = Vector3.cast(
            [1, 1, 1], [1, -1, 1], [-1, 1, 1], [-1, -1, 1], [1, 1, -1], [1, -1, -1], [-1, 1, -1], [-1, -1, -1],
            [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
            [1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]);
        this.arrays.color = Vector3.cast(
            hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"),
            hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"),
            hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"),
            hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"),
            hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"),
            hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"), hex_color("#ffffff"));
        this.indices = false;
    }
}

export class Beyond_Tetris extends Scene {
    constructor() {
        super();

        //Initialize the value of this.block_map
        this.initialize_map();

        //Record the current active piece as array of 4 blocks position [[x, y, z], [], [], []]
        this.current = 1;
        this.current_pos = vec3(MAX_ROW / 2, MAX_LEVEL, MAX_COL / 2);

        this.shapes = {
            'block': new Block(),
            'outline': new Cube_Outline(),
        };

        this.materials = block_materials;
        this.white = new Material(new defs.Basic_Shader());

        this.direction = null;

        this.initial_camera_location = Mat4.look_at(vec3(10, 25, 15), vec3(0, 8, 0), vec3(0, 1, 0));
    }


    initialize_map() {
        //this.block_map records all blocks in the scene
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
        this.block_map[0][0][0] = 1;
        this.block_map[0][2][0] = 3;
        this.block_map[0][3][3] = 3;
        this.block_map[1][3][3] = 3;
        // this.block_map[2][3][3] = 3;
        // this.block_map[3][3][3] = 3;
        this.block_map[0][3][4] = 2;
        this.block_map[1][3][4] = 2;
        this.block_map[2][3][4] = 2;
        this.block_map[3][3][4] = 2;
        this.block_map[0][MAX_ROW - 1][MAX_COL - 1] = 4;
        
        // the highest point in current block map
        this.highest = 3;
    }


    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("restart", ["c"], () => {

        });
        // Add a button for controlling the scene.
        this.key_triggered_button("Outline", ["o"], () => {

        });
        this.key_triggered_button("Sit still", ["m"], () => {

        });
        this.new_line();
        this.key_triggered_button("Move forward", ["Control", "s"], () => {this.direction = "forward"});
        this.key_triggered_button("Move backward", ["Control", "w"], () => {this.direction = "backward"});
        this.key_triggered_button("Move Left", ["Control", "a"], () => {this.direction = "left"});
        this.key_triggered_button("Move right", ["Control", "d"], () => {this.direction = "right"});
        // this.key_triggered_button("Attach to planet 4", ["Control", "4"], () => this.attached = () => this.planet_4);
        // this.new_line();
        // this.key_triggered_button("Attach to moon", ["Control", "m"], () => this.attached = () => this.moon);
    }

    detect_collision() {
        let lowest = Math.floor(this.current_pos[1]) - tetrominoes[this.current].depth;
        //console.log(lowest)
        if (lowest <= this.highest+1 && lowest > 0) {
            // traverse through all the blocks in the current tetromino
            for (let blockIndex = 0; blockIndex < 4; blockIndex ++) {
                // traverse through all the levels in the block map
                let block = tetrominoes[this.current].blocks[blockIndex];
                let curr_row = this.current_pos[0] + block[2];

                // have to add 0.9 so that the function only return true when two blocks are 0.1 distance apart
                // can't think a better solution right not that can return true when the two blocks are entirely stick together
                // subject to improvement later
                let curr_depth = Math.floor(this.current_pos[1]+0.9) + block[1];
                let curr_col = this.current_pos[2] + block[0];
                if(this.block_map[curr_depth-1][curr_row][curr_col] != 0) {
                    return true;
                }
            }
        }
        return false;
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        // draw the outline
        let model_transform_outline = Mat4.identity();
        model_transform_outline = model_transform_outline.times(Mat4.translation(-1, 7, -1)).times(Mat4.scale(MAX_ROW, MAX_LEVEL, MAX_COL));
        this.shapes.outline.draw(context, program_state, model_transform_outline, this.white, "LINES")

        let model_transform = Mat4.identity();
        const t = this.t = program_state.animation_time;
        //this.shapes.block.draw(context, program_state, model_transform, this.materials.plastic);

        //For testing
        const init_transform = model_transform.times(Mat4.translation(-6, 0, -6));
        model_transform = init_transform;

        //Display all blocks in the block_map
        //this.shapes.block.draw(context, program_state, model_transform, this.materials.plastic.override({color: block_colors[1]}));
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


        //console.log(this.current_pos)
        if (this.detect_collision() || this.current_pos[1] - tetrominoes[this.current].depth < 0) {
            this.current = Math.floor(Math.random() * (8 - 1 + 1) + 1);
            this.current_pos = vec3(MAX_ROW / 2, MAX_LEVEL, MAX_COL / 2);
        }
        this.current_pos = tetrominoes[this.current].fall(this.current_pos);
        if (this.direction != null) {
            this.current_pos = tetrominoes[this.current].move(this.current_pos, this.direction);
            this.direction = null;
        }
        
        tetrominoes[this.current].display(this.current_pos, this, context, program_state, init_transform);
    }
}