const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let bubbles = [];
let connections = [];
let selectedBubble = null;
let isDragging = false;
let offsetX, offsetY;
let holdTimer;
const holdTime = 500;

// Constants for physics
const damping = 0.95;
const attraction = 0.005;

function addBubble() {
    const bubble = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 30,
        color: '#3498db',
        label: `Bubble ${bubbles.length + 1}`,
        isDragging: false
    };
    bubbles.push(bubble);
    redraw();
}

function addConnectedBubble() {
    if (selectedBubble) {
        const newBubble = {
            x: selectedBubble.x + 80,
            y: selectedBubble.y + 50,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: 30,
            color: '#3498db',
            label: `Bubble ${bubbles.length + 1}`,
            isDragging: false
        };
        bubbles.push(newBubble);
        connections.push([selectedBubble, newBubble]);
        selectedBubble = null;
        redraw();
    }
}

function drawBubble(bubble) {
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fillStyle = bubble.color;
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = '14px Arial';
    ctx.fillText(bubble.label, bubble.x, bubble.y + 4);
}

function drawConnections() {
    connections.forEach(([bubble1, bubble2]) => {
        drawArrow(bubble1, bubble2);
    });
}

function drawArrow(bubble1, bubble2) {
    const angle = Math.atan2(bubble2.y - bubble1.y, bubble2.x - bubble1.x);
    const startX = bubble1.x + bubble1.radius * Math.cos(angle);
    const startY = bubble1.y + bubble1.radius * Math.sin(angle);
    const endX = bubble2.x - bubble2.radius * Math.cos(angle);
    const endY = bubble2.y - bubble2.radius * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    const arrowHeadLength = 10;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - arrowHeadLength * Math.cos(angle - Math.PI / 6),
        endY - arrowHeadLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        endX - arrowHeadLength * Math.cos(angle + Math.PI / 6),
        endY - arrowHeadLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.lineTo(endX, endY);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.closePath();
}

function applyPhysics() {
    for (let bubble of bubbles) {
        if (!bubble.isDragging) {
            bubble.x += bubble.vx;
            bubble.y += bubble.vy;

            // Wall collisions
            if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > canvas.width) {
                bubble.vx = -bubble.vx * damping;
            }
            if (bubble.y - bubble.radius < 0 || bubble.y + bubble.radius > canvas.height) {
                bubble.vy = -bubble.vy * damping;
            }

            // Bubble collisions
            for (let other of bubbles) {
                if (bubble !== other && detectCollision(bubble, other)) {
                    resolveCollision(bubble, other);
                }
            }
        }
    }
}

function detectCollision(bubble1, bubble2) {
    const dx = bubble1.x - bubble2.x;
    const dy = bubble1.y - bubble2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < bubble1.radius + bubble2.radius;
}

function resolveCollision(bubble1, bubble2) {
    const dx = bubble1.x - bubble2.x;
    const dy = bubble1.y - bubble2.y;
    const angle = Math.atan2(dy, dx);

    const totalMass = bubble1.radius + bubble2.radius;
    bubble1.vx -= attraction * (bubble1.radius / totalMass) * dx;
    bubble1.vy -= attraction * (bubble1.radius / totalMass) * dy;
    bubble2.vx += attraction * (bubble2.radius / totalMass) * dx;
    bubble2.vy += attraction * (bubble2.radius / totalMass) * dy;
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections();
    bubbles.forEach(drawBubble);
}

canvas.addEventListener('mousedown', (e) => {
    const { offsetX: x, offsetY: y } = e;
    selectedBubble = bubbles.find(b => Math.hypot(b.x - x, b.y - y) < b.radius);
    if (selectedBubble) {
        offsetX = x - selectedBubble.x;
        offsetY = y - selectedBubble.y;
        isDragging = true;

        // Long press for adding a connected bubble
        holdTimer = setTimeout(() => {
            addConnectedBubble();
            isDragging = false;
        }, holdTime);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && selectedBubble) {
        const { offsetX: x, offsetY: y } = e;
        selectedBubble.x = x - offsetX;
        selectedBubble.y = y - offsetY;
        redraw();
    }
});

canvas.addEventListener('mouseup', () => {
    clearTimeout(holdTimer);
    isDragging = false;
    selectedBubble = null;
});

function animate() {
    applyPhysics();
    redraw();
    requestAnimationFrame(animate);
}

function exportDiagram() {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'bubble_diagram.png';
    link.click();
}

animate();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
});
