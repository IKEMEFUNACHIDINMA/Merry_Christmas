const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const music = document.getElementById('backgroundMusic');

// Base dimensions (reference size)
const BASE_WIDTH = 1200;
const BASE_HEIGHT = 700;

// Calculate responsive canvas size
function resizeCanvas() {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    
    // Calculate scale to fit screen while maintaining aspect ratio
    const scaleX = maxWidth / BASE_WIDTH;
    const scaleY = maxHeight / BASE_HEIGHT;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond base size
    
    canvas.width = BASE_WIDTH * scale;
    canvas.height = BASE_HEIGHT * scale;
    
    // Store scale for drawing operations
    canvas.scale = scale;
    
    // Set CSS size for display
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
}

// Initialize canvas size
resizeCanvas();

// Update on window resize
window.addEventListener('resize', resizeCanvas);

// Animation state
let animationFrame = 0;
let scene = 1;
let loopCount = 0;
let fadeAlpha = 1;
let sceneTransition = false;
const maxLoops = 2;

// Scene timings (slower, more enjoyable)
const sceneTimings = {
    scene1: 360,  // Box falling (~6 seconds at 60fps)
    scene2: 480,  // Girl picks up and walks off (~8 seconds)
    scene3: 2230  // Family scene: girl enters, drops box, family gathers, opens, dancing (~22 seconds with longer dancing)
};

// Helper function to scale positions
function scaleX(x) {
    return x * (canvas.width / BASE_WIDTH);
}

function scaleY(y) {
    return y * (canvas.height / BASE_HEIGHT);
}

function scaleSize(size) {
    return size * Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT);
}

// Original family positions (for resetting) - using base coordinates
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

// Characters - positions will be scaled when drawing
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
    const scale = Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT);
    ctx.translate(scaleX(x), scaleY(y));
    ctx.scale(scale, scale);
    
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
    
    // Draw smile - moves with the character and shows when dancing
    if (danceOffset !== 0 || characters.text.visible) {
        const headY = -40 + Math.sin(danceOffset) * 5;
        ctx.beginPath();
        ctx.arc(0, headY + 5, 12, 0, Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawBox(x, y, rotation) {
    ctx.save();
    const scale = Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT);
    ctx.translate(scaleX(x), scaleY(y));
    ctx.scale(scale, scale);
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
    ctx.save();
    const scale = Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT);
    ctx.translate(scaleX(x), scaleY(y));
    ctx.scale(scale, scale);
    
    ctx.fillStyle = colors.table;
    ctx.fillRect(-100, 0, 200, 20);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-100, 0, 200, 20);
    
    // Table legs
    ctx.fillRect(-100, 20, 10, 30);
    ctx.fillRect(90, 20, 10, 30);
    ctx.strokeRect(-100, 20, 10, 30);
    ctx.strokeRect(90, 20, 10, 30);
    
    ctx.restore();
}

function drawText(text, x, y, textScale, rotation) {
    ctx.save();
    const scale = Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT);
    ctx.translate(scaleX(x), scaleY(y));
    ctx.scale(scale * textScale, scale * textScale);
    ctx.rotate(rotation);
    
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
    const scale = Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT);
    const numFlakes = Math.floor(50 * scale);
    for (let i = 0; i < numFlakes; i++) {
        const x = (i * 37) % canvas.width;
        const y = (animationFrame * 2 + i * 23) % canvas.height;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
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
        characters.box.y += 3;  // Slower falling
        characters.box.rotation += 0.06;  // Slower rotation
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
        if (scene2Frame < 100) {
            if (characters.girl.state === 'hidden') {
                characters.girl.state = 'appearing';
                characters.girl.x = -100;
            }
            characters.girl.x = Math.min(150, characters.girl.x + 2);
        }
        // Girl walks to box (box is at x: 600 from scene 1)
        else if (scene2Frame < 240) {
            if (characters.girl.x < characters.box.x - 50) {
                characters.girl.x += 1.8;
            }
        }
        // Pick up box
        else if (scene2Frame < 300) {
            characters.box.x = characters.girl.x + 30;
            characters.box.y = characters.girl.y - 20;
        }
        // Walk off screen (to the right) - leaving scene 2
        else {
            if (characters.girl.x < BASE_WIDTH + 100) {
                characters.girl.x += 1.8;
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
        if (scene3Frame < 240) {
            if (characters.girl.x < characters.table.x - 100) {
                characters.girl.x += 1.8;
                characters.box.x = characters.girl.x + 30;
                characters.box.y = characters.girl.y - 20;
            }
        }
        // Drop box on table
        else if (scene3Frame < 300) {
            characters.box.x = characters.table.x;
            characters.box.y = characters.table.y - 40;
            characters.girl.x = characters.table.x - 100;
        }
        // Family moves closer to surround the box (longer gathering)
        else if (scene3Frame < 540) {
            const gatherProgress = (scene3Frame - 300) / 240; // 0 to 1
            
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
        // Pause before opening box - longer anticipation
        else if (scene3Frame < 600) {
            // Family is gathered, waiting... (pause for anticipation)
            // Box is on table, family is around it, but box hasn't opened yet
        }
        // Open box, text jumps out
        else if (scene3Frame < 720) {
            if (!characters.text.visible && scene3Frame >= 600) {
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
                characters.text.scale = Math.min(1, characters.text.scale + 0.035);
                characters.text.rotation = Math.sin(animationFrame * 0.08) * 0.2;
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
            const danceSpeed = 0.18;  // Slower dancing
            characters.family.father.danceOffset += danceSpeed;
            characters.family.mother.danceOffset += danceSpeed;
            characters.family.children.forEach(child => {
                child.danceOffset += danceSpeed;
            });
            // Ensure girl has danceOffset initialized
            if (!characters.girl.danceOffset) {
                characters.girl.danceOffset = 0;
            }
            characters.girl.danceOffset += danceSpeed;
            characters.text.rotation = Math.sin(animationFrame * 0.1) * 0.3;
            characters.text.x = 700 + Math.sin(animationFrame * 0.07) * 50;
            characters.text.y = 400 + Math.cos(animationFrame * 0.07) * 30;
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
        
        // Smiles are now drawn inside drawStickFigure function, so they move with characters
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

// Play button element
const playButton = document.getElementById('playButton');
const playButtonBtn = playButton ? playButton.querySelector('button') : null;

// Music playback with aggressive autoplay and error handling
function startMusic() {
    music.volume = 0.7;
    music.preload = 'auto';
    music.currentTime = 0;
    
    // Check if audio file loads successfully
    music.addEventListener('error', (e) => {
        console.error('Audio file failed to load:', e);
        console.log('The audio file may be too large for Vercel. Please host it externally.');
        // Try to use fallback if available
        const fallback = document.getElementById('fallbackAudio');
        if (fallback && music.src !== fallback.src) {
            console.log('Trying fallback audio source...');
            music.src = fallback.src;
            music.load();
        } else {
            console.log('No fallback available. Please upload the MP3 to an external host and update the src in index.html');
        }
    });
    
    music.addEventListener('canplaythrough', () => {
        console.log('Audio file loaded successfully');
    });
    
    const playMusic = () => {
        if (music.paused && music.readyState >= 2) { // Check if audio is ready
            music.currentTime = 0;
            const playPromise = music.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Music started playing');
                        if (playButton) playButton.style.display = 'none';
                    })
                    .catch(err => {
                        console.log('Autoplay blocked, showing play button');
                        if (playButton) playButton.style.display = 'block';
                    });
            }
        } else if (music.readyState < 2) {
            // Audio not loaded yet, wait a bit
            setTimeout(playMusic, 200);
        } else {
            if (playButton) playButton.style.display = 'none';
        }
    };
    
    // Try multiple times with different strategies
    playMusic();
    setTimeout(playMusic, 100);
    setTimeout(playMusic, 500);
    setTimeout(playMusic, 1000);
    
    // Try on any user interaction
    const interactionEvents = ['click', 'touchstart', 'keydown', 'mousedown'];
    const startOnInteraction = () => {
        playMusic();
        interactionEvents.forEach(event => {
            document.removeEventListener(event, startOnInteraction);
        });
    };
    
    interactionEvents.forEach(event => {
        document.addEventListener(event, startOnInteraction, { once: true });
    });
    
    // Play button click handler
    if (playButtonBtn) {
        playButtonBtn.addEventListener('click', () => {
            music.currentTime = 0;
            music.play().then(() => {
                playButton.style.display = 'none';
            }).catch(err => {
                console.log('Failed to play:', err);
            });
        });
    }
}

// Start animation and music
function startAnimation() {
    startMusic();
    animate();
}

// Start immediately when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAnimation);
} else {
    startAnimation();
}

// Also try on window load
window.addEventListener('load', () => {
    startMusic();
});

// Canvas click to start music
canvas.addEventListener('click', () => {
    if (music.paused) {
        music.currentTime = 0;
        music.play().catch(err => console.log('Audio play failed:', err));
    }
});

// Touch support for mobile
canvas.addEventListener('touchstart', () => {
    if (music.paused) {
        music.currentTime = 0;
        music.play().catch(err => console.log('Audio play failed:', err));
    }
});

