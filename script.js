// script.js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth - 40; // Account for padding
canvas.height = window.innerHeight - 160; // Account for controls and instructions

let bubbles = [];
let connections = [];
let selectedBubble = null;
let isDragging = false;
let offsetX, offsetY;
let holdTimer;
const holdTime = 500;

// Enhanced physics constants
const DAMPING = 0.7;
const SPRING_STRENGTH = 0.03;
const SPRING_LENGTH = 120;
const COLLISION_DAMPING = 0.8;
const FRICTION = 0.98;
const MIN_SPEED = 0.01;

class Bubble {
    constructor(x, y, label) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 30;
        this.color = '#3498db';
        this.label = label;
        this.isDragging = false;
        this.mass = 1;
    }

    update() {
        if (this.isDragging) return;

        // Apply friction
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Stop very small movements
        if (Math.abs(this.vx) < MIN_SPEED) this.vx = 0;
        if (Math.abs(this.vy) < MIN_SPEED) this.vy = 0;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Boundary collision
        this.handleBoundaryCollision();
    }

    handleBoundaryCollision() {
        const margin = 5;
        if (this.x - this.radius < margin) {
            this.x = this.radius + margin;
            this.vx = Math.abs(this.vx) * DAMPING;
        }
        if (this.x + this.radius > canvas.width - margin) {
            this.x = canvas.width - this.radius - margin;
            this.vx = -Math.abs(this.vx) * DAMPING;
        }
        if (this.y - this.radius < margin) {
            this.y = this.radius + margin;
            this.vy = Math.abs(this.vy) * DAMPING;
        }
        if (this.y + this.radius > canvas.height - margin) {
            this.y = canvas.height - this.radius - margin;
            this.vy = -Math.abs(this.vy) * DAMPING;
        }
    }
}

class Connection {
    constructor(bubble1, bubble2) {
        this.bubble1 = bubble1;
        this.bubble2 = bubble2;
        this.length = SPRING_LENGTH;
    }

    update() {
        const dx = this.bubble2.x - this.bubble1.x;
        const dy = this.bubble2.y - this.bubble1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;

        const force = (distance - this.length) * SPRING_STRENGTH;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        if (!this.bubble1.isDragging) {
            this.bubble1.vx += fx;
            this.bubble1.vy += fy;
        }
        if (!this.bubble2.isDragging) {
            this.bubble2.vx -= fx;
            this.bubble2.vy -= fy;
        }
    }

    draw() {
        const dx = this.bubble2.x - this.bubble1.x;
        const dy = this.bubble2.y - this.bubble1.y;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Draw spring-like connection
        ctx.beginPath();
        ctx.moveTo(this.bubble1.x, this.bubble1.y);
        
        // Calculate control points for curve
        const midX = (this.bubble1.x + this.bubble2.x) / 2;
        const midY = (this.bubble1.y + this.bubble2.y) / 2;
        const curvature = Math.sin(Date.now() / 300) * 20; // Animate curvature
        const perpX = -dy / distance * curvature;
        const perpY = dx / distance * curvature;

        ctx.quadraticCurveTo(midX + perpX, midY + perpY, this.bubble2.x, this.bubble2.y);
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw arrow head
        const arrowSize = 10;
        const arrowX = this.bubble2.x - this.bubble2.radius * Math.cos(angle);
        const arrowY = this.bubble2.y - this.bubble2.radius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.fillStyle = '#2980b9';
        ctx.fill();
    }
}

function handleCollisions() {
    for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
            const b1 = bubbles[i];
            const b2 = bubbles[j];
            
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = b1.radius + b2.radius;

            if (distance < minDist) {
                // Collision detected
                const angle = Math.atan2(dy, dx);
                const targetX = b1.x + Math.cos(angle) * minDist;
                const targetY = b1.y + Math.sin(angle) * minDist;

                // Move bubbles apart
                const ax = (targetX - b2.x);
                const ay = (targetY - b2.y);

                if (!b1.isDragging) {
                    b1.vx -= ax * COLLISION_DAMPING;
                    b1.vy -= ay * COLLISION_DAMPING;
                }
                if (!b2.isDragging) {
                    b2.vx += ax * COLLISION_DAMPING;
                    b2.vy += ay * COLLISION_DAMPING;
                }
            }
        }
    }
}

function addBubble() {
    const padding = 100; // Ensure bubbles aren't created too close to the edges
    const bubble = new Bubble(
        Math.random() * (canvas.width - 2 * padding) + padding,
        Math.random() * (canvas.height - 2 * padding) + padding,
        `Bubble ${bubbles.length + 1}`
    );
    bubbles.push(bubble);
}

function addConnectedBubble() {
    if (selectedBubble) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 100;
        const newBubble = new Bubble(
            selectedBubble.x + Math.cos(angle) * distance,
            selectedBubble.y + Math.sin(angle) * distance,
            `Bubble ${bubbles.length + 1}`
        );
        bubbles.push(newBubble);
        connections.push(new Connection(selectedBubble, newBubble));
        selectedBubble = null;
    }
}

function drawBubble(bubble) {
    // Draw shadow
    ctx.beginPath();
    ctx.arc(bubble.x + 2, bubble.y + 2, bubble.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fill();

    // Draw bubble
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(
        bubble.x - bubble.radius/3, 
        bubble.y - bubble.radius/3,
        0,
        bubble.x,
        bubble.y,
        bubble.radius
    );
    gradient.addColorStop(0, '#4ab3f4');
    gradient.addColorStop(1, '#2980b9');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw label
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(bubble.label, bubble.x, bubble.y + 4);
}

function update() {
    connections.forEach(conn => conn.update());
    bubbles.forEach(bubble => bubble.update());
    handleCollisions();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    connections.forEach(conn => conn.draw());
    bubbles.forEach(bubble => drawBubble(bubble));
}

function animate() {
    update();
    render();
    requestAnimationFrame(animate);
}

// Event Handlers
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    selectedBubble = bubbles.find(b => 
        Math.hypot(b.x - x, b.y - y) < b.radius
    );
    
    if (selectedBubble) {
        selectedBubble.isDragging = true;
        offsetX = x - selectedBubble.x;
        offsetY = y - selectedBubble.y;
        
        holdTimer = setTimeout(addConnectedBubble, holdTime);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (selectedBubble?.isDragging) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        selectedBubble.x = x - offsetX;
        selectedBubble.y = y - offsetY;
        selectedBubble.vx = 0;
        selectedBubble.vy = 0;
    }
});

canvas.addEventListener('mouseup', () => {
    if (selectedBubble) {
        selectedBubble.isDragging = false;
    }
    clearTimeout(holdTimer);
    selectedBubble = null;
});

function exportDiagram() {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'bubble_diagram.png';
    link.click();
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth - 40;
    canvas.height = window.innerHeight - 160;
});

// Start animation
animate();