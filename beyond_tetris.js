import {defs, tiny} from './examples/common.js';
import {Block, block_materials, block_colors} from './block.js';
//import {Block_shader} from "./block_shader";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

//Size of the map
const MAX_LEVEL = 8;
const MAX_ROW = 6;
const MAX_COL = 6;

export class Beyond_tetris extends Scene {
    constructor() {
        super();

        //Initialize the value of this.block_map
        this.initialize_map();

        //Record the current active piece as array of 4 blocks position [[x, y, z], [], [], []]
        this.current = null;

        this.shapes = {
            'block': new Block(),
        };

        this.materials = block_materials;
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
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(5, -10, -30));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];



        let model_transform = Mat4.identity();
        const t = this.t = program_state.animation_time;
        //this.shapes.block.draw(context, program_state, model_transform, this.materials.plastic);

        //For testing
        model_transform = model_transform.times(Mat4.translation(-6, 0, -6));

        //Display all blocks in the block_map

        //For testing
        this.block_map[0][0][0] = 1;
        this.block_map[0][2][0] = 3;
        this.block_map[0][0][3] = 3;
        this.block_map[1][0][0] = 2;
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
                model_transform = model_transform.times(Mat4.translation(-12, 0, 2));
            }
            model_transform = model_transform.times(Mat4.translation(0, 2, -12));
        }


    }
}