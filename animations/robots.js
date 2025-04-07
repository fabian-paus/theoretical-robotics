console.log("Robots");

/**
 * @typedef Pos
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef RobotDef
 * @property {number} l1 Length of the first segment
 * @property {number} l2 Length of the second segment
 */

/**
 * @typedef RobotConfig
 * @property {number} q1 Angle of the first joint
 * @property {number} q2 Angle of the second joint
 */

const robotDef = /** @type {RobotDef} */ ({
    l1: 20,
    l2: 20,

    q1_min: 0.25 * Math.PI,
    q1_max: 0.75 * Math.PI,

    q2_min: -Math.PI / 2,
    q2_max: +Math.PI / 2,
    
    // q1_min: 0,
    // q1_max: Math.PI,

    // q2_min: -Math.PI,
    // q2_max: +Math.PI,
});

const robotPos = { x: 0, y: 0 };

/**
 * @typedef ForwardResult
 * @property {Pos} seg1
 * @property {Pos} seg2
 */

/**
 * 
 * @param {RobotDef} def 
 * @param {RobotConfig} config 
 * @returns {ForwardResult}
 */
function forward(def, config) {
    const seg1 = {
        x: robotPos.x + def.l1 * Math.cos(config.q1),
        y: robotPos.y + def.l1 * Math.sin(config.q1),
    };
    const seg2 = {
        x: seg1.x + def.l2 * Math.cos(config.q1 + config.q2),
        y: seg1.y + def.l2 * Math.sin(config.q1 + config.q2),
    };
    return { seg1, seg2 };
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Pos} from 
 * @param {Pos} to 
 */
function line(ctx, from, to) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

/**
 * @param {Pos} center 
 * @param {number} radius 
 * @returns {Path2D}
 */
function circle(center, radius) {
    const path = new Path2D();
    path.ellipse(center.x, center.y, radius, radius, 
        0, 0, 2 * Math.PI);
    return path;
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {RobotConfig} config
 */
function drawRobot(ctx, config) {
    ctx.reset();

    // Scale everything with the width of the canvas
    const w = ctx.canvas.width;
    const scale_x = w / 100;

    ctx.transform(
        1, 0, 
        0, -1,
        w / 2, 
        ctx.canvas.height - 10 * scale_x,
    );
    ctx.lineWidth = scale_x;

    const pos = robotPos;

    // Base
    const baseWidth = 20 * scale_x;
    const baseStartX = pos.x - baseWidth / 2;
    const baseEndX = pos.x + baseWidth / 2
    line(ctx, { x: baseStartX, y: pos.y }, { x: baseEndX, y: pos.y });

    // Lines under the base
    const baseLineLength = baseWidth / 6;
    const lineCount = 5;
    for (let i = 0; i <= lineCount; ++i) {
        const xOffset = baseStartX + i * baseWidth / lineCount;
        line(ctx, 
            { x: xOffset, y: pos.y }, 
            { x: xOffset - baseLineLength, y: pos.y - baseLineLength });
    }

    const state = forward(robotDef, config);

    // TODO: Bake scaling into the transformation
    state.seg1.x *= scale_x;
    state.seg1.y *= scale_x;
    state.seg2.x *= scale_x;
    state.seg2.y *= scale_x;
    
    line(ctx, pos, state.seg1);
    line(ctx, state.seg1, state.seg2);

    // Draw joints
    const jointDotRadius = 2.5 * scale_x;
    const seg1Joint = circle(pos, jointDotRadius);
    const seg2Joint = circle(state.seg1, jointDotRadius);
    const endPoint = circle(state.seg2, jointDotRadius);

    ctx.fill(seg1Joint);
    ctx.fill(seg2Joint);
    ctx.fill(endPoint);
}

const mouse = {
    pos: { x: 0, y: 0 },
    left: {
        down: false,
    },
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {RobotDef} def 
 * @param {RobotConfig} config 
 */
function drawConfigSpace(ctx, def, config) {
    ctx.reset();

    const x_min = -Math.PI;
    const x_max = +Math.PI;
    const x_range = x_max - x_min;

    const y_min = -Math.PI;
    const y_max = +Math.PI;
    const y_range = y_max - y_min;


    const scale = (ctx.canvas.width / x_range) * 0.9;

    ctx.lineWidth = 1.0 / scale;

    ctx.transform(
        scale, 0,
        0, -scale,
        ctx.canvas.width / 2,
        ctx.canvas.width / 2,
    );

    // Config space
    ctx.fillStyle = '#BAEBF0';
    ctx.fillRect(def.q1_min, def.q2_min,
        def.q1_max - def.q1_min,
        def.q2_max - def.q2_min);

    // Coordinate system
    line(ctx, { x: x_min, y: 0}, { x: x_max, y: 0});
    line(ctx, { x: 0, y: y_min}, { x: 0, y: y_max});

    // Current configuration
    const current = circle({ x: config.q1, y: config.q2}, 4 / scale);
    ctx.fillStyle = '#48A6A7';
    ctx.fill(current);

    const selected = circle({ x: config.q1, y: config.q2}, 7 / scale);
    const hover = ctx.isPointInPath(selected, mouse.pos.x, mouse.pos.y);
    if (hover) {
        ctx.fill(selected);
    }

    if (mouse.left.down) {
        const q = ctx.getTransform().inverse().transformPoint(mouse.pos);
        config.q1 = q.x;
        config.q1 = Math.min(Math.max(config.q1, def.q1_min), def.q1_max);
        config.q2 = q.y;
        config.q2 = Math.min(Math.max(config.q2, def.q2_min), def.q2_max);

        // TODO: Apply limits
        setConfigInpus();
        nextFrame();
    }
}

/**
 * @typedef Workspace
 * @property {number[][]} data
 * @property {number} min_x
 * @property {number} max_x
 * @property {number} min_y
 * @property {number} max_y
 * @property {number} length_x
 * @property {number} length_y
 * @property {number} tick_x
 * @property {number} tick_y
 */

/**
 * 
 * @param {RobotDef} def 
 * @returns {Workspace}
 */
function createWorkspace(def) {
    const len = def.l1 + def.l2;
    const min_x = -len;
    const max_x = +len;
    const min_y = 0;
    const max_y = +len;

    const data = [];
    for (let y = min_x; y <= max_y; ++y) {
        const row = [];
        for (let x = min_x; x <= max_x; ++x) {
            row.push(0);
        }
        data.push(row);
    }

    // How many elements do we have in each dimension?
    const length_x = 40;
    const length_y = 20;

    // How big is an element?
    const range_x = max_x - min_x;
    const tick_x = range_x / length_x;
    const range_y = max_y - min_y;
    const tick_y = range_y / length_y;
    return { data, min_x, max_x, min_y, max_y,
        length_x,
        length_y,
        tick_x,
        tick_y,
     };
}

/**
 * 
 * @param {Workspace} workspace 
 * @param {number} x 
 * @param {number} y 
 * @param {number} value 
 */
function setWorkspaceValue(workspace, x, y, value) {
    if (y < workspace.min_y || y > workspace.max_y) return;
    if (x < workspace.min_x || x > workspace.max_x) return;

    const y_offset = y - workspace.min_y;
    const y_range = workspace.max_y - workspace.min_y;
    const y_index = Math.floor(y_offset / workspace.tick_y);

    const x_offset = x - workspace.min_x;
    const x_range = workspace.max_x - workspace.min_x;
    const x_index = Math.floor(x_offset / workspace.tick_x);

    workspace.data[y_index][x_index] = value;

}

const workspace = createWorkspace(robotDef);

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {RobotDef} def 
 * @param {RobotConfig} config 
 */
function drawWorkSpace(ctx, def, config) {
    ctx.reset();

    const len = def.l1 + def.l2;
    const x_min = -len ;
    const x_max = +len;
    const x_range = x_max - x_min;

    const y_min = -len;
    const y_max = +len;
    const y_range = y_max - y_min;


    const scale = (ctx.canvas.width / x_range) * 0.9;
    const px = 1.0 / scale;

    ctx.lineWidth = 1.0 * px;

    ctx.transform(
        scale, 0,
        0, -scale,
        ctx.canvas.width / 2,
        ctx.canvas.width / 2,
    );

    const state = forward(def, config);

    const x = state.seg2.x;
    const y = state.seg2.y;

    setWorkspaceValue(workspace, x, y, 1);

    // Draw workspace pixels
    for (let y = 0; y < workspace.data.length; ++y) {
        const row = workspace.data[y];
        for (let x = 0; x < row.length; ++x) {
            const filled = row[x];
            if (filled) {
                ctx.fillStyle = '#F87070'
            } else {
                ctx.fillStyle = '#EEEEEE';
            }

            const x_pos = workspace.min_x + x * workspace.tick_x;
            const y_pos = workspace.min_y + y * workspace.tick_y;
            ctx.fillRect(x_pos, y_pos, workspace.tick_x, workspace.tick_y);
        }
    }

    // Coordinate system
    ctx.strokeStyle = '#000000';
    line(ctx, { x: x_min, y: 0}, { x: x_max, y: 0});
    line(ctx, { x: 0, y: y_min}, { x: 0, y: y_max});

    ctx.lineWidth = 2.0 * px;
    ctx.strokeStyle = '#D84040';
    line(ctx, robotPos, state.seg1);
    line(ctx, state.seg1, state.seg2);

    const pos = circle(state.seg2, 6.0 * px);
    ctx.fillStyle = '#D84040';
    ctx.fill(pos);
}

/**
 * 
 * @param {string} elementId 
 * @returns {CanvasRenderingContext2D}
 */
function getContext(elementId) {
    const canvas = /** @type {HTMLCanvasElement} */(document.getElementById(elementId));
    if (!canvas) {
        throw new Error("Could not find <canvas> with ID: " + elementId);
    }
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Could not create 2D canvas context for element ID: " + elementId);
    }

    return context;
}

const robotContext = getContext("robot");
const configContext = getContext("config");
const workContext = getContext("work");


const config = { q1: 0, q2: 0 };

const q1Input = document.getElementById("q1");
const q2Input = document.getElementById("q2");
function updateConfig() {
    const q1Ratio = q1Input.value / 100.0;
    const q1 = robotDef.q1_min + q1Ratio * (robotDef.q1_max - robotDef.q1_min);
    config.q1 = q1;

    const q2Ratio = q2Input.value / 100.0;
    const q2 = robotDef.q2_min + q2Ratio * (robotDef.q2_max - robotDef.q2_min);
    config.q2 = q2;
}

function setConfigInpus() {
    const q1Ratio = (config.q1 - robotDef.q1_min) / (robotDef.q1_max - robotDef.q1_min);
    q1Input.value = Math.floor(100.0 * q1Ratio);

    const q2Ratio = (config.q2 - robotDef.q2_min) / (robotDef.q2_max - robotDef.q2_min);
    q2Input.value = Math.floor(100.0 * q2Ratio);
}

function draw() {
    if (!mouse.left.down) {
        updateConfig();
    }
    drawRobot(robotContext, config);
    drawConfigSpace(configContext, robotDef, config);
    drawWorkSpace(workContext, robotDef, config);
}

function nextFrame() {
    window.requestAnimationFrame(draw);
}


q1Input.addEventListener('input', function() {
    nextFrame();
});


q2Input.addEventListener('input', function() {
    nextFrame();
});

configContext.canvas.addEventListener('mousemove', function(event) {
    mouse.pos.x = event.offsetX;
    mouse.pos.y = event.offsetY;
    nextFrame();
});

configContext.canvas.addEventListener('mousedown', function(event) {
    mouse.left.down = true;
    nextFrame();
});

configContext.canvas.addEventListener('mouseup', function(event) {
    mouse.left.down = false;
    nextFrame();
});

nextFrame();