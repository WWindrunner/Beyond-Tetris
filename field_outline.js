import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

// The white line around the field as a white rectangle
class Field_Outline extends Shape {
    constructor() {
        super("position", "color");
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

export {Field_Outline};