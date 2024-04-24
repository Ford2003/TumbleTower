"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const matter_js_1 = require("matter-js");
const Verts = __importStar(require("../utils/blockVerts"));
const decomp = __importStar(require("../decomp"));
matter_js_1.Common.setDecomp(decomp);
function Block({ type, x, y, rotation, colour }, isStatic, engine, id) {
    // set the vertices based on the type of block
    let vertices;
    switch (type) {
        case 'T':
            vertices = Verts.T;
            break;
        case 'I':
            vertices = Verts.I;
            break;
        case 'L':
            vertices = Verts.L;
            break;
        case 'J':
            vertices = Verts.J;
            break;
        case 'S':
            vertices = Verts.S;
            break;
        case 'Z':
            vertices = Verts.Z;
            break;
        case 'O':
            vertices = Verts.O;
            break;
        default:
            vertices = [];
            console.log('No vertices found for block type: ', type);
    }
    if (id === undefined) {
        id = matter_js_1.Common.nextId();
    }
    const blockBody = matter_js_1.Bodies.fromVertices(x, y, [vertices], {
        isStatic: isStatic,
        frictionAir: 0,
        id: id,
        friction: 0,
        render: {
            fillStyle: colour,
        },
    }, false, 0.01, 10, 0.01);
    matter_js_1.Body.rotate(blockBody, rotation);
    matter_js_1.Body.setVelocity(blockBody, { x: 0, y: 1 });
    console.log(`Block Body: ${blockBody}, rotation: ${rotation}, id: ${blockBody.id}, id: ${id}`);
    matter_js_1.Composite.add(engine.world, blockBody);
    return blockBody;
}
exports.Block = Block;
