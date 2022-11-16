import {defs, tiny} from './examples/common.js';
import {Block, block_materials, block_colors} from './block.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Tetromino {
    constructor(id, blocks, center_of_rotation) {
        this.id = id;
        this.blocks = blocks;
        this.center_of_rotation = center_of_rotation;
        this.position = vec3(0, 0, 0);
    }

    copy(position) {
        let tetromino = new Tetromino(this.id, this.blocks, this.center_of_rotation);
        tetromino.position = vec3(position[0], position[1], position[2]);
        return tetromino;
    }

    display(game_state, context, program_state, model_transform) {
        this.blocks.forEach(block => {
            const block_model_transform = model_transform.times(Mat4.translation(
                2 * (block[0] + this.position[0]),
                2 * (Math.ceil(block[1] + this.position[1])),
                2 * (block[2] + this.position[2])
            ));
            game_state.shapes.block.draw(context, program_state, block_model_transform, 
                game_state.materials.plastic.override({color: block_colors[this.id]})
            );
        });
    }

    // rotate the tetromino 90 degree by the desired axis (x, y, z)
    rotate(game_state, axis) {
    }

    // translate the tetromino one block distance to the desired direction
    // (up, down, left, right) horizontally
    move(direction, game_state) {
        if (this.check_bounds(game_state.num_rows, game_state.num_cols, direction) && 
                this.check_collision(game_state, direction))
            this.position.add_by(direction);
        // return pos;
    }

    check_bounds(max_row, max_col, delta_pos) {
        const x = this.position[0] + delta_pos[0];
        const z = this.position[2] + delta_pos[2];
        for (let i = 0; i < 4; i++) {
            const block = this.blocks[i];
            const bx = block[0] + x;
            const bz = block[2] + z;
            
            if (bx < 0 || bz < 0 || bx >= max_row || bz >= max_col)
                return false;
        }
        return true;
    }

    check_collision(game_state, delta_pos) {
        const block_map = game_state.block_map;
        const x = this.position[0] + delta_pos[0];
        const y = Math.ceil(this.position[1]);
        const z = this.position[2] + delta_pos[2];

        for (let i = 0; i < 4; i++) {
            const block = this.blocks[i];
            const bx = block[0] + x;
            const by = block[1] + y;
            const bz = block[2] + z;

            if (block_map[by][bz][bx] != 0)
                return false;
        }
        return true;
    }

    // fall() is called every frame to move the block downward vertically
    fall(speed) {
        this.position.add_by(vec3(0, -speed, 0))
        return this.position;
    }

    // Detect collisions between tetrominoes
    detect_collision(game_state, speed) {
        const block_map = game_state.block_map;

        for (let i = 0; i < 4; i++) {
            const block = this.blocks[i];
            const x = block[0] + this.position[0];
            const y = Math.ceil(block[1] + this.position[1] - speed);
            const z = block[2] + this.position[2];

            // Tetromino hits the bottom of the stage
            if (y < 0) {
                // this.position[1] = Math.floor(this.position[1] + 1);
                return true;
            }

            // if there's a block in block map right below this current block, return true
            if (block_map[y][z][x] !== 0) {
                return true;
            }
        }
        return false;
    }

    place_blocks(game_state) {
        for (let blockIndex = 0; blockIndex < 4; blockIndex ++) {
            const block = this.blocks[blockIndex];
            const curr_row = this.position[2] + block[2];
            const curr_col = this.position[0] + block[0];
            const curr_depth = Math.ceil(this.position[1] + block[1]);

            // place the blocks in block map 
            game_state.block_map[curr_depth][curr_row][curr_col] = this.id;
        }
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