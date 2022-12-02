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

    display(game_state, context, program_state, model_transform, is_projection=false) {
        this.blocks.forEach(block => {
            const block_model_transform = model_transform.times(Mat4.translation(
                2 * (block[0] + this.position[0]),
                2 * (Math.ceil(block[1] + this.position[1])),
                2 * (block[2] + this.position[2])
            ));

            game_state.shapes.block.draw(context, program_state, block_model_transform,
                game_state.materials.block_mat.override({
                    color: block_colors[this.id],
                    transparency: is_projection ? 0.5 : 0,
                })
            );

        });
    }

    get_depth() {
        let depth = 0;
        for (let i = 0; i < 4; i++) {
            const block = this.blocks[i];
            const z = block[2] + this.position[2];
            if (z > depth)
                depth = z;
        }
        return depth;
    }

    // Rotate the tetromino 90 degree by the desired axis (x, y, z)
    rotate(game_state, axis) {
        const recenter = Mat4.translation(
            this.center_of_rotation[0],
            this.center_of_rotation[1],
            this.center_of_rotation[2]
        );
        const rotation = Mat4.rotation(Math.PI / 2.0, axis[0], axis[1], axis[2]);
        const decenter = Mat4.inverse(recenter);

        let new_blocks = Array(4);
        for (let i = 0; i < 4; i++) {
            const new_pos = recenter.times(rotation).times(decenter).times(         
                vec4(this.blocks[i][0], this.blocks[i][1], this.blocks[i][2], 1)
            );
            // console.log(new_pos);
            new_blocks[i] = vec3(Math.trunc(new_pos[0]), Math.trunc(new_pos[1]), Math.trunc(new_pos[2]));
        }

        const fixed_pos = this.fix_bounds(game_state.num_rows, game_state.num_cols, this.position, new_blocks);
        if (this.check_collision(game_state, fixed_pos, new_blocks)) {
            this.position = fixed_pos;
            this.blocks = new_blocks;
        }
    }

    // Translate the tetromino one block distance to the desired direction
    // (up, down, left, right) horizontally
    move(direction, game_state) {
        const new_position = vec3(
            this.position[0] + direction[0],
            this.position[1] + direction[1],
            this.position[2] + direction[2],
        );
        const fixed_pos = this.fix_bounds(game_state.num_rows, game_state.num_cols, new_position);
        if (this.check_collision(game_state, fixed_pos))
            this.position = fixed_pos;
    }

    // Adjust blocks to not be out of bounds
    fix_bounds(max_row, max_col, new_pos=this.position, new_blocks=this.blocks) {
        const x = new_pos[0];
        const z = new_pos[2];
        let dx = 0;
        let dz = 0;
        
        for (let i = 0; i < 4; i++) {
            const block = new_blocks[i];
            const bx = block[0] + x;
            const bz = block[2] + z;
            
            if (bx < 0 && -bx > dx)
                dx = -bx;
            if (bz < 0 && -bz > dz)
                dz = -bz;
            if (bx >= max_col && max_col - bx - 1 < dx)
                dx = max_col - bx - 1;
            if (bz >= max_row && max_row - bz - 1 < dz)
                dz = max_row - bz - 1;
        }
        
        // console.log(new_pos, dx, dz);

        return vec3(
            new_pos[0] + dx,
            new_pos[1],
            new_pos[2] + dz
        );
    }

    // Move should not cause a collision with another tetromino
    check_collision(game_state, new_pos=this.position, new_blocks=this.blocks) {
        const block_map = game_state.block_map;
        const x = new_pos[0];
        const y = Math.ceil(new_pos[1]);
        const z = new_pos[2];

        for (let i = 0; i < 4; i++) {
            const block = new_blocks[i];
            const bx = block[0] + x;
            const by = block[1] + y;
            const bz = block[2] + z;

            // console.log(by, bz, bx);
            if (by < game_state.num_levels && by >= 0 && block_map[by][bz][bx] !== 0)
                return false;
        }
        return true;
    }

    // fall() is called every frame to move the block downward vertically
    fall(speed) {
        this.position.add_by(vec3(0, -speed, 0))
        return this.position;
    }

    // Detect collisions between tetrominoes and between floor
    detect_collision(game_state, speed) {
        const block_map = game_state.block_map;

        for (let i = 0; i < 4; i++) {
            const block = this.blocks[i];
            const x = block[0] + this.position[0];
            const y = Math.ceil(block[1] + this.position[1] - speed);
            const z = block[2] + this.position[2];

            // Tetromino hits the bottom of the stage
            if (y < 0)
                return true;

            // if there's a block in block map right below this current block, return true
            if (y < game_state.num_levels && block_map[y][z][x] !== 0) {
                //console.log(y, z, x, block_map[y][z][x])
                return true;
            }
        }
        return false;
    }

    // Return the indicator of the current tetromino
    get_projection_tetromino(game_state) {
        const y = this.position[1];

        while (!this.detect_collision(game_state, 0)) {
            this.position[1] -= 1;
        }
        this.position[1] += 1;
        let tetromino_projection = this.copy(this.position);
        this.position[1] = y;

        return tetromino_projection;
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
    1: new Tetromino(1, [vec3(0, 0, 0), vec3(-1, 0, 0), vec3(1, 0, 0), vec3(2, 0, 0)], vec3(1, 0, 0)),
    2: new Tetromino(2, [vec3(0, 0, 0), vec3(-1, 0, 0), vec3(1, 0, 0), vec3(1, -1, 0)], vec3(1, 0, 0)),
    3: new Tetromino(3, [vec3(0, 0, 0), vec3(-1, 0, 0), vec3(0, -1, 0), vec3(1, -1, 0)], vec3(0, -1, 0)),
    4: new Tetromino(4, [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, -1, 0), vec3(1, -1, 0)], vec3(0, 0, 0)),
    5: new Tetromino(5, [vec3(0, 0, 0), vec3(-1, 0, 0), vec3(0, -1, 0), vec3(0, -1, 1)], vec3(0, 0, 0)),
    6: new Tetromino(6, [vec3(0, 0, 0), vec3(-1, 0, 0), vec3(0, -1, 0), vec3(0, -1, -1)], vec3(0, 0, 0)),
    7: new Tetromino(7, [vec3(0, 0, 0), vec3(0, -1, 0), vec3(1, -1, 0), vec3(0, -1, 1)], vec3(0, -1, 0)),
    8: new Tetromino(8, [vec3(0, 0, 0), vec3(0, -1, 0), vec3(-1, -1, 0), vec3(1, -1, 0)], vec3(0, -1, 0)),
};

export {tetrominoes};