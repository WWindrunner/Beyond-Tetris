import {defs, tiny} from './examples/common.js';
import {Block_Shader} from "./block_shader.js";

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

class Block extends Shape {
    constructor() {
        super("position", "normal", "texture_coord");
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
            [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
        this.arrays.texture_coord = [
            vec(0, 0), vec(1, 0), vec(0, 1), vec(1, 1),
            vec(0, 0), vec(1, 0), vec(0, 1), vec(1, 1),
            vec(0, 0), vec(1, 0), vec(0, 1), vec(1, 1),
            vec(0, 0), vec(1, 0), vec(0, 1), vec(1, 1),
            vec(0, 0), vec(1, 0), vec(0, 1), vec(1, 1),
            vec(0, 0), vec(1, 0), vec(0, 1), vec(1, 1),
        ]

        this.face_positions = Vector3.cast(
            [1, 1, 1], [1, 1, 1], [1, 1, 1],
            [-1, -1, -1], [-1, -1, -1], [-1, -1, -1],
        );
        this.face_normals = Vector3.cast(
            [1, 0, 0], [0, 1, 0], [0, 0, 1],
            [-1, 0, 0], [0, -1, 0], [0, 0, -1],
        );
    }
}

const block_materials = {
    // Material for normal tetromino blocks
    plastic: new Material(new defs.Phong_Shader(),
        {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
    // A transparent shader to show where the block will fall
    block_mat: new Material(new Block_Shader(),
        {ambient: .3, diffusivity: .3, color: hex_color("#ffffff"), transparency: 0.7}),
};

const block_colors = {
    1: hex_color("#00c4c7"),
    2: hex_color("#ff8e24"),
    3: hex_color("#fc1414"),
    4: hex_color("#f0ff24"),
    5: hex_color("#ff2495"),
    6: hex_color("#3624ff"),
    7: hex_color("#24ff57"),
    8: hex_color("#bd24ff"),
};

export {Block, block_materials, block_colors};