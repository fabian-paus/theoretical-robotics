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
    l1: 50,
    l2: 50,

    q1_min: 0.0,
    q1_max: Math.PI,

    q2_min: -Math.PI / 2,
    q2_max: +Math.PI / 2,
});

const robotPos = { x: 150, y: 130 };

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
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Pos} center 
 * @param {number} radius 
 */
function circle(ctx, center, radius) {
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, radius, radius, 
        0, 0, 2 * Math.PI);
    ctx.stroke();
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {RobotConfig} config
 */
function drawRobot(ctx, config) {

    ctx.reset();

    const pos = robotPos;

    // Base
    const baseWidth = 60;
    const baseStartX = pos.x - baseWidth / 2;
    const baseEndX = pos.x + baseWidth / 2
    line(ctx, { x: baseStartX, y: pos.y }, { x: baseEndX, y: pos.y });

    // Lines under the base
    const baseLineLength = baseWidth / 6;
    const lineCount = 5;
    for (let i = 0; i <= lineCount; ++i) {
        const xOffset = baseStartX + i * baseWidth / (lineCount);
        line(ctx, 
            { x: xOffset, y: pos.y }, 
            { x: xOffset - baseLineLength, y: pos.y + baseLineLength });
    }


    const seg1 = {
        x: pos.x + robotDef.l1 * Math.cos(config.q1),
        y: pos.y + robotDef.l1 * Math.sin(-config.q1),
    };
    
    line(ctx, pos, seg1);

    const seg2 = {
        x: seg1.x + robotDef.l2 * Math.cos(config.q1 + config.q2),
        y: seg1.y + robotDef.l2 * Math.sin(-(config.q1 + + config.q2)),
    };
    
    line(ctx, seg1, seg2);

    // Draw joints
    const jointDotRadius = 5;
    circle(ctx, seg1, jointDotRadius);
    circle(ctx, pos, jointDotRadius);
}

const robot = /** @type {HTMLCanvasElement} */(document.getElementById("robot"));

const ctx = robot.getContext("2d");
if (!ctx) {
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


updateConfig();
drawRobot(ctx, config);


q1Input.addEventListener('input', function() {
    updateConfig();
    drawRobot(ctx, config);
});


q2Input.addEventListener('input', function() {
    updateConfig();
    drawRobot(ctx, config);
});