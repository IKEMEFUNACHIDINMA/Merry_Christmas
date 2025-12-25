const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const music = document.getElementById('backgroundMusic');

// Set canvas size
canvas.width = 1200;
canvas.height = 700;

// Animation state
let animationFrame = 0;
let scene = 1;
let loopCount = 0;
let fadeAlpha = 1;
let sceneTransition = false;
const maxLoops = 2;

// Scene timings (slower, more enjoyable)
const sceneTimings = {
    scene1: 280,  // Box falling (~4.7 seconds at 60fps)
    scene2: 360,  // Girl picks up and walks off (~6 seconds)
    scene3: 900  // Family scene: girl enters, drops box, family gathers, opens, dancing (~15 seconds)
};

// Original family positions (for resetting)
const originalFamilyPositions = {
    father: { x: 800, y: 400 },
    mother: { x: 900, y: 400 },
    children: [
        { x: 1000, y: 400 },
        { x: 1100, y: 400 },
        { x: 850, y: 500 },
        { x: 950, y: 500 },
        { x: 1050, y: 500 }
    ]
};

// Characters
const characters = {
    girl: { x: -100, y: 500, targetX: 200, targetY: 500, state: 'hidden' },
    box: { x: 600, y: -100, targetY: 500, state: 'falling', rotation: 0 },
    family: {
        father: { x: 800, y: 400, danceOffset: 0, targetX: 800, targetY: 400 },
        mother: { x: 900, y: 400, danceOffset: 0, targetX: 900, targetY: 400 },
        children: [
            { x: 1000, y: 400, danceOffset: 0, targetX: 1000, targetY: 400 },
            { x: 1100, y: 400, danceOffset: 0, targetX: 1100, targetY: 400 },
            { x: 850, y: 500, danceOffset: 0, targetX: 850, targetY: 500 },
            { x: 950, y: 500, danceOffset: 0, targetX: 950, targetY: 500 },
            { x: 1050, y: 500, danceOffset: 0, targetX: 1050, targetY: 500 }
        ]
    },
    table: { x: 700, y: 450, width: 200, height: 20 },
    text: { x: 700, y: 400, scale: 0, rotation: 0, visible: false, particles: [] }
};

// Colors
const colors = {
    sky: ['#87ceeb', '#e0f6ff', '#fff'],
    box: '#ff0000',
    boxRibbon: '#00ff00',
    girl: { body: '#ff69b4', head: '#ffb6c1' },
    male: { body: '#4169e1', head: '#87ceeb' },
    female: { body: '#ff69b4', head: '#ffb6c1' },
    table: '#8b4513',
    text: '#ff0000'
};

// Draw functions
function drawStickFigure(x, y, type, danceOffset = 0) {
    ctx.save();
    ctx.translate(x, y);
    
    // Head
    const headColor = type === 'male' ? colors.male.head : colors.female.head;
    const bodyColor = type === 'male' ? colors.male.body : colors.female.body;
    
    ctx.beginPath();
    ctx.arc(0, -40 + Math.sin(danceOffset) * 5, 15, 0, Math.PI * 2);
    ctx.fillStyle = headColor;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Hair for females
    if (type === 'female') {
        ctx.beginPath();
        ctx.arc(0, -40 + Math.sin(danceOffset) * 5, 18, 0, Math.PI);
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    // Body
    ctx.beginPath();
    ctx.moveTo(0, -25 + Math.sin(danceOffset) * 5);
    ctx.lineTo(0, 20 + Math.sin(danceOffset) * 5);
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Arms
    const armSwing = Math.sin(danceOffset) * 20;
    ctx.beginPath();
    ctx.moveTo(0, -10 + Math.sin(danceOffset) * 5);
    ctx.lineTo(-15 + armSwing, 10 + Math.sin(danceOffset) * 5);
    ctx.moveTo(0, -10 + Math.sin(danceOffset) * 5);
    ctx.lineTo(15 - armSwing, 10 + Math.sin(danceOffset) * 5);
    ctx.stroke();
    
    // Legs
    const legSwing = Math.sin(danceOffset + Math.PI / 2) * 15;
    ctx.beginPath();
    ctx.moveTo(0, 20 + Math.sin(danceOffset) * 5);
    ctx.lineTo(-10 + legSwing, 50 + Math.sin(danceOffset) * 5);
    ctx.moveTo(0, 20 + Math.sin(danceOffset) * 5);
    ctx.lineTo(10 - legSwing, 50 + Math.sin(danceOffset) * 5);
    ctx.stroke();
    
    // Dress for females (triangle shape)
    if (type === 'female') {
        ctx.beginPath();
        ctx.moveTo(-15, 15 + Math.sin(danceOffset) * 5);
        ctx.lineTo(15, 15 + Math.sin(danceOffset) * 5);
        ctx.lineTo(0, 35 + Math.sin(danceOffset) * 5);
        ctx.closePath();
        ctx.fillStyle = colors.female.body;
        ctx.fill();
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawBox(x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Box
    ctx.fillStyle = colors.box;
    ctx.fillRect(-40, -40, 80, 80);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(-40, -40, 80, 80);
    
    // Ribbon
    ctx.fillStyle = colors.boxRibbon;
    ctx.fillRect(-40, -5, 80, 10);
    ctx.fillRect(-5, -40, 10, 80);
    
    // Bow
    ctx.beginPath();
    ctx.arc(-20, -40, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, -40, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawTable(x, y) {
    ctx.fillStyle = colors.table;
    ctx.fillRect(x - 100, y, 200, 20);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 100, y, 200, 20);
    
    // Table legs
    ctx.fillRect(x - 100, y + 20, 10, 30);
    ctx.fillRect(x + 90, y + 20, 10, 30);
    ctx.strokeRect(x - 100, y + 20, 10, 30);
    ctx.strokeRect(x + 90, y + 20, 10, 30);
}

function drawText(text, x, y, scale, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = colors.text;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = text.split(' ');
    lines.forEach((line, i) => {
        ctx.fillText(line, 0, i * 60 - (lines.length - 1) * 30);
        ctx.strokeText(line, 0, i * 60 - (lines.length - 1) * 30);
    });
    
    ctx.restore();
}

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, colors.sky[0]);
    gradient.addColorStop(0.5, colors.sky[1]);
    gradient.addColorStop(1, colors.sky[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Snowflakes
    for (let i = 0; i < 50; i++) {
        const x = (i * 37) % canvas.width;
        const y = (animationFrame * 2 + i * 23) % canvas.height;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Animation scenes
function updateScene() {
    const totalFrames = sceneTimings.scene1 + sceneTimings.scene2 + sceneTimings.scene3;
    let frame = animationFrame % totalFrames;
    
    // Handle scene transitions with fade
    if (frame === 0 && animationFrame > 0) {
        // Reset for new loop
        resetCharacters();
    }
    
    // Scene 1: ONLY box falling (no girl, no family)
    if (frame < sceneTimings.scene1) {
        scene = 1;
        characters.box.y += 4;  // Slower falling
        characters.box.rotation += 0.08;  // Slower rotation
        if (characters.box.y > characters.box.targetY) {
            characters.box.y = characters.box.targetY;
            characters.box.state = 'landed';
        }
        
        // Fade transition at end of scene 1
        if (frame >= sceneTimings.scene1 - 60) {
            fadeAlpha = Math.max(0, fadeAlpha - 0.017);
        } else {
            fadeAlpha = Math.min(1, fadeAlpha + 0.025);
        }
    }
    // Scene 2: Girl appears, picks up box, walks to family
    else if (frame < sceneTimings.scene1 + sceneTimings.scene2) {
        scene = 2;
        const scene2Frame = frame - sceneTimings.scene1;
        
        // Fade in
        if (scene2Frame < 60) {
            fadeAlpha = Math.min(1, fadeAlpha + 0.017);
        }
        
        // Ensure box is at landing position (from scene 1)
        if (scene2Frame === 0) {
            characters.box.y = characters.box.targetY;
            characters.box.state = 'landed';
        }
        
        // Girl appears from side
        if (scene2Frame < 80) {
            if (characters.girl.state === 'hidden') {
                characters.girl.state = 'appearing';
                characters.girl.x = -100;
            }
            characters.girl.x = Math.min(150, characters.girl.x + 3);
        }
        // Girl walks to box (box is at x: 600 from scene 1)
        else if (scene2Frame < 200) {
            if (characters.girl.x < characters.box.x - 50) {
                characters.girl.x += 2.5;
            }
        }
        // Pick up box
        else if (scene2Frame < 250) {
            characters.box.x = characters.girl.x + 30;
            characters.box.y = characters.girl.y - 20;
        }
        // Walk off screen (to the right) - leaving scene 2
        else {
            if (characters.girl.x < canvas.width + 100) {
                characters.girl.x += 2.5;
                characters.box.x = characters.girl.x + 30;
            }
        }
    }
    // Scene 3: Family scene - girl enters, drops box, family gathers, box opens, dancing
    else {
        scene = 3;
        const scene3Frame = frame - sceneTimings.scene1 - sceneTimings.scene2;
        
        // Fade in
        if (scene3Frame < 60) {
            fadeAlpha = Math.min(1, fadeAlpha + 0.017);
            // Reset girl position to enter from left
            if (scene3Frame === 0) {
                characters.girl.x = -100;
                characters.girl.state = 'visible';
                characters.box.x = -100; // Box off screen initially
            }
        }
        
        // Girl enters from left and walks to table
        if (scene3Frame < 180) {
            if (characters.girl.x < characters.table.x - 100) {
                characters.girl.x += 2.5;
                characters.box.x = characters.girl.x + 30;
                characters.box.y = characters.girl.y - 20;
            }
        }
        // Drop box on table
        else if (scene3Frame < 240) {
            characters.box.x = characters.table.x;
            characters.box.y = characters.table.y - 40;
            characters.girl.x = characters.table.x - 100;
        }
        // Family moves closer to surround the box
        else if (scene3Frame < 420) {
            const gatherProgress = (scene3Frame - 240) / 180; // 0 to 1
            
            // Calculate positions around the table
            const centerX = characters.table.x;
            const centerY = characters.table.y - 60;
            const radius = 120 - (gatherProgress * 40); // Get closer
            
            // Position family in a circle around the box
            const angles = [
                Math.PI * 0.2,   // father
                Math.PI * 0.8,   // mother
                Math.PI * 0.0,   // child 1
                Math.PI * 0.4,   // child 2
                Math.PI * 1.2,   // child 3
                Math.PI * 1.6,   // child 4
                Math.PI * 1.0    // child 5
            ];
            
            // Move from original positions to gathered positions
            const startPos = originalFamilyPositions.father;
            characters.family.father.x = startPos.x + (centerX + Math.cos(angles[0]) * radius - startPos.x) * gatherProgress;
            characters.family.father.y = startPos.y + (centerY + Math.sin(angles[0]) * radius - startPos.y) * gatherProgress;
            
            const startPosM = originalFamilyPositions.mother;
            characters.family.mother.x = startPosM.x + (centerX + Math.cos(angles[1]) * radius - startPosM.x) * gatherProgress;
            characters.family.mother.y = startPosM.y + (centerY + Math.sin(angles[1]) * radius - startPosM.y) * gatherProgress;
            
            originalFamilyPositions.children.forEach((startPos, i) => {
                const child = characters.family.children[i];
                child.x = startPos.x + (centerX + Math.cos(angles[i + 2]) * radius - startPos.x) * gatherProgress;
                child.y = startPos.y + (centerY + Math.sin(angles[i + 2]) * radius - startPos.y) * gatherProgress;
            });
        }
        // Open box, text jumps out
        else if (scene3Frame < 600) {
            if (!characters.text.visible && scene3Frame >= 420) {
                characters.text.visible = true;
                // Create text particles
                for (let i = 0; i < 20; i++) {
                    characters.text.particles.push({
                        x: characters.text.x,
                        y: characters.text.y,
                        vx: (Math.random() - 0.5) * 8,
                        vy: -Math.random() * 12 - 4,
                        life: 120
                    });
                }
            }
            if (characters.text.visible) {
                characters.text.scale = Math.min(1, characters.text.scale + 0.04);
                characters.text.rotation = Math.sin(animationFrame * 0.1) * 0.2;
            }
            
            // Update particles
            characters.text.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.3;
                p.life--;
            });
            characters.text.particles = characters.text.particles.filter(p => p.life > 0);
        }
        // Dancing
        else {
            const danceSpeed = 0.25;
            characters.family.father.danceOffset += danceSpeed;
            characters.family.mother.danceOffset += danceSpeed;
            characters.family.children.forEach(child => {
                child.danceOffset += danceSpeed;
            });
            characters.girl.danceOffset = (characters.girl.danceOffset || 0) + danceSpeed;
            characters.text.rotation = Math.sin(animationFrame * 0.15) * 0.3;
            characters.text.x = 700 + Math.sin(animationFrame * 0.1) * 50;
            characters.text.y = 400 + Math.cos(animationFrame * 0.1) * 30;
        }
    }
}

function resetCharacters() {
    characters.box = { x: 600, y: -100, targetY: 500, state: 'falling', rotation: 0 };
    characters.girl = { x: -100, y: 500, targetX: 200, targetY: 500, state: 'hidden', danceOffset: 0 };
    characters.text = { x: 700, y: 400, scale: 0, rotation: 0, visible: false, particles: [] };
    
    // Reset family positions to original
    characters.family.father.x = originalFamilyPositions.father.x;
    characters.family.father.y = originalFamilyPositions.father.y;
    characters.family.father.danceOffset = 0;
    
    characters.family.mother.x = originalFamilyPositions.mother.x;
    characters.family.mother.y = originalFamilyPositions.mother.y;
    characters.family.mother.danceOffset = 0;
    
    originalFamilyPositions.children.forEach((pos, i) => {
        characters.family.children[i].x = pos.x;
        characters.family.children[i].y = pos.y;
        characters.family.children[i].danceOffset = 0;
    });
    
    fadeAlpha = 1;
}

function drawScene() {
    drawBackground();
    
    ctx.save();
    ctx.globalAlpha = fadeAlpha;
    
    // Scene 1: Only box
    if (scene === 1) {
        if (characters.box.y > -50) {
            drawBox(characters.box.x, characters.box.y, characters.box.rotation);
        }
    }
    // Scene 2: Girl and box (no family yet)
    else if (scene === 2) {
        // Draw box
        if (characters.box.y > -50) {
            drawBox(characters.box.x, characters.box.y, characters.box.rotation);
        }
        
        // Draw girl
        if (characters.girl.state !== 'hidden') {
            drawStickFigure(characters.girl.x, characters.girl.y, 'female', 0);
        }
    }
    // Scene 3: Full scene with family
    else if (scene === 3) {
        // Draw table
        drawTable(characters.table.x, characters.table.y);
        
        // Draw box
        if (characters.box.y > -50) {
            drawBox(characters.box.x, characters.box.y, characters.box.rotation);
        }
        
        // Draw family
        drawStickFigure(characters.family.father.x, characters.family.father.y, 'male', characters.family.father.danceOffset);
        drawStickFigure(characters.family.mother.x, characters.family.mother.y, 'female', characters.family.mother.danceOffset);
        characters.family.children.forEach(child => {
            drawStickFigure(child.x, child.y, 'female', child.danceOffset);
        });
        
        // Draw girl
        if (characters.girl.state !== 'hidden') {
            drawStickFigure(characters.girl.x, characters.girl.y, 'female', characters.girl.danceOffset || 0);
        }
        
        // Draw text
        if (characters.text.visible) {
            drawText('MERRY CHRISTMAS TO YOU!', characters.text.x, characters.text.y, characters.text.scale, characters.text.rotation);
            
            // Draw particles
            characters.text.particles.forEach(p => {
                ctx.fillStyle = `rgba(255, 0, 0, ${p.life / 100})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // Draw expressions (smiles) when text is visible
        if (characters.text.visible) {
            [characters.family.father, characters.family.mother, ...characters.family.children, characters.girl].forEach(char => {
                if (char.x && char.y) {
                    ctx.beginPath();
                    ctx.arc(char.x, char.y - 40, 12, 0, Math.PI);
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });
        }
    }
    
    ctx.restore();
    
    // Fade overlay for transitions
    if (fadeAlpha < 1) {
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - fadeAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateScene();
    drawScene();
    
    animationFrame++;
    
    // Check if we need to loop
    const totalFrames = sceneTimings.scene1 + sceneTimings.scene2 + sceneTimings.scene3;
    if (animationFrame >= totalFrames) {
        loopCount++;
        if (loopCount < maxLoops) {
            // Reset animation
            animationFrame = 0;
            resetCharacters();
        } else {
            // Stop animation
            return;
        }
    }
    
    requestAnimationFrame(animate);
}

// Start animation and music
function startAnimation() {
    // Set music properties
    music.volume = 0.6;
    music.preload = 'auto';
    music.currentTime = 0; // Start from beginning
    
    // Try to play music with multiple attempts
    const playMusic = () => {
        music.currentTime = 0; // Always start from beginning
        const playPromise = music.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Music started playing from beginning');
                })
                .catch(err => {
                    console.log('Audio play failed, will retry on user interaction:', err);
                    // Add click handler if autoplay fails
                    document.addEventListener('click', () => {
                        music.currentTime = 0;
                        music.play().catch(e => console.log('Audio play failed:', e));
                    }, { once: true });
                });
        }
    };
    
    // Try to play immediately when animation starts
    playMusic();
    
    // Also try after a short delay
    setTimeout(playMusic, 300);
    
    animate();
}

// Start on page load
window.addEventListener('load', () => {
    startAnimation();
});

// Allow click anywhere to start music if autoplay is blocked
document.addEventListener('click', () => {
    if (music.paused) {
        music.currentTime = 0; // Start from beginning
        music.play().catch(err => console.log('Audio play failed:', err));
    }
}, { once: true });

// Also allow canvas click
canvas.addEventListener('click', () => {
    if (music.paused) {
        music.currentTime = 0; // Start from beginning
        music.play().catch(err => console.log('Audio play failed:', err));
    }
});

