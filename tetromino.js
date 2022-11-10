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

        // a vecor that record a tetromino's boundary distance from it's center
        // from the first entry to the fourth: leftDisFromCenter, rightDisFromCenter,
        // frontDisFromCenter, backDisFromCenter. This vector is initialized later.
        this.distanceFromCenter = vec4(0, 0, 0, 0);

        // a variable that record a tetromino's depth distance from it's center
        this.depth = 0;

        // initialize the distance variables of the tetromino
        this.initialized_boundary();

        //both of the above variables are updated during rotation
    }

    initialized_boundary() {
        if (this.id == 1) {
            this.distanceFromCenter = vec4(0, 0, 0, 0);
            this.depth = 3;
        }
        else if (this.id == 2) {
            this.distanceFromCenter = vec4(0, 1, 0, 0);
            this.depth = 2;
        }
        else if (this.id == 3) {
            this.distanceFromCenter = vec4(0, 2, 0, 0);
            this.depth = 1;
        }
        else if (this.id == 4) {
            this.distanceFromCenter = vec4(1, 0, 0, 0);
            this.depth = 1;
        }
        else if (this.id == 5) {
            this.distanceFromCenter = vec4(0, 1, 1, 0);
            this.depth = 1;
        }
        else if (this.id == 6) {
            this.distanceFromCenter = vec4(0, 1, 0, 1);
            this.depth = 1;
        }
        else if (this.id == 7) {
            this.distanceFromCenter = vec4(0, 1, 1, 0);
            this.depth = 1;
        }
        else if (this.id == 8) {
            this.distanceFromCenter = vec4(1, 1, 0, 0);
            this.depth = 1;
        }
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

    rotate(game_state, context, program_state, model_transform, direction) {
        // rotate the tetromino 90 degree by the desired axis (x, y, z)

        return model_transform;
    }

    move(pos, direction) {
        // translate the tetromino one block distance to the desired direction 
        // (up, down, left, right) horizontally
        if(direction === "left") {
            if (pos[0] >= 1+this.distanceFromCenter[0]) {
                pos.add_by(vec3(-1, 0, 0));
            }
        }
        else if(direction === "right") {
            if (pos[0] <= 4-this.distanceFromCenter[1]) {
                pos.add_by(vec3(1, 0, 0));
            }
        }
        else if(direction === "forward") {
            if (pos[2] <= 4-this.distanceFromCenter[2]) {
                pos.add_by(vec3(0, 0, 1));
            }
        }
        else if(direction === "backward") {
            if (pos[2] >= 1+this.distanceFromCenter[3]) {
                pos.add_by(vec3(0, 0, -1));
            }
        }
        return pos;
    }

    fall(pos) {
        // fall() is called every frame to move the block downward vertically
        pos.add_by(vec3(0, -0.04, 0))
        return pos;
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