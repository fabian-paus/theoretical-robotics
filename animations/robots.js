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


    const l1 = scale_x * robotDef.l1;
    const seg1 = {
        x: pos.x + l1 * Math.cos(config.q1),
        y: pos.y + l1 * Math.sin(config.q1),
    };
    
    line(ctx, pos, seg1);

    const l2 = scale_x * robotDef.l2;
    const seg2 = {
        x: seg1.x + l2 * Math.cos(config.q1 + config.q2),
        y: seg1.y + l2 * Math.sin(config.q1 + config.q2),
    };
    
    line(ctx, seg1, seg2);

    // Draw joints
    const jointDotRadius = 2.5 * scale_x;
    const seg1Joint = circle(pos, jointDotRadius);
    const seg2Joint = circle(seg1, jointDotRadius);
    const endPoint = circle(seg2, jointDotRadius);

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

const robot = /** @type {HTMLCanvasElement} */(document.getElementById("robot"));

const robotContext = robot.getContext("2d");
if (!robotContext) {
    throw new Error("Could not create 2D canvas context");
}

const configCanvas = /** @type {HTMLCanvasElement} */(document.getElementById("config"));

const configContext = configCanvas.getContext("2d");
if (!configContext) {
    throw new Error("Could not create 2D canvas context");
}

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

configCanvas.addEventListener('mousemove', function(event) {
    mouse.pos.x = event.offsetX;
    mouse.pos.y = event.offsetY;
    nextFrame();
});

configCanvas.addEventListener('mousedown', function(event) {
    mouse.left.down = true;
    nextFrame();
});

configCanvas.addEventListener('mouseup', function(event) {
    mouse.left.down = false;
    nextFrame();
});

nextFrame();