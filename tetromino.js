import {defs, tiny} from './examples/common.js';
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;
import {Block, block_materials, block_colors} from './block.js';

class Tetromino {
    constructor(id, blocks, center) {
        this.id = id;
        this.blocks = blocks;
        this.center = center;
    }

    display(pos, game_state, context, program_state, model_transform) {
        this.blocks.forEach(block => {
            const block_model_transform = model_transform.times(Mat4.translation(
                2 * (block[0] + pos[0]),
                2 * (block[1] + pos[1]),
                2 * (block[2] + pos[2])
            ));
            game_state.shapes.block.draw(context, program_state, block_model_transform, 
                game_state.materials.plastic.override({color: block_colors[this.id]})
            );
        });
    }

    rotate() {

    }
}

const tetrominoes = {
    1: new Tetromino(1, [vec3(0, 0, 0), vec3(0, -1, 0), vec3(0, -2, 0), vec3(0, -3, 0)], vec3(0, -1, 0)),
    2: new Tetromino(2, [vec3(0, 0, 0), vec3(0, -1, 0), vec3(0, -2, 0), vec3(1, -2, 0)], vec3(0, -1, 0)),
    3: new Tetromino(3, [vec3(0, 0, 0), vec3(1, 0, 0), vec3(1, -1, 0), vec3(2, -1, 0)], vec3(0, -1, 0)),
    4: new Tetromino(4, [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, -1, 0), vec3(1, -1, 0)], vec3(0, -1, 0)),
    5: new Tetromino(5, [vec3(0, 0, 0), vec3(1, 0, 0), vec3(1, -1, 0), vec3(1, -1, 1)], vec3(0, -1, 0)),
    6: new Tetromino(6, [vec3(0, 0, 0), vec3(1, 0, 0), vec3(1, -1, 0), vec3(1, -1, -1)], vec3(0, -1, 0)),
    7: new Tetromino(7, [vec3(0, 0, 0), vec3(0, -1, 0), vec3(1, -1, 0), vec3(0, -1, 1)], vec3(0, -1, 0)),
    8: new Tetromino(8, [vec3(0, 0, 0), vec3(0, -1, 0), vec3(-1, -1, 0), vec3(1, -1, 0)], vec3(0, -1, 0)),
};

export {tetrominoes};