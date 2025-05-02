// Main game script - dino.js
//board
let board;
let boardWidth = 750;
let boardHeight = 250;
let context;

//dino
let dinoWidth = 88;
let dinoHeight = 94;
let dinoX = 50;
let dinoY = boardHeight - dinoHeight;
let dinoImg;

let dino = {
    x: dinoX,
    y: dinoY,
    width: dinoWidth,
    height: dinoHeight
}

//cactus
let cactusArray = [];

let cactus1Width = 34;
let cactus2Width = 69;
let cactus3Width = 102;

let cactusHeight = 70;
let cactusX = 700;
let cactusY = boardHeight - cactusHeight;

let cactus1Img;
let cactus2Img;
let cactus3Img;

//physics
let initialVelocityX = -6;
let velocityX = initialVelocityX;
let velocityY = 0;
let gravity = 0.4;

// Game state variables
let gameOver = false;
let gameStarted = false;
let score = 0;
let highScore = 0;
let chancesLeft = 10;
let countdownActive = false;
let countdownValue = 3;
let speedIncreaseInterval = 500; // Increase speed every 500 points
let maxVelocity = -14; // Maximum speed cap

// Animation frames
let dinoRunFrames = [];
let currentRunFrame = 0;
let frameCount = 0;

// Mobile detection
let isMobile = false;

// MCQ Questions
let mcqQuestions = [
    // Fallback questions in case API fails
   ];

// Try to load questions from the template
try {
    const questionDataElement = document.getElementById('question-data');
    if (questionDataElement && questionDataElement.dataset.questions) {
        const parsedQuestions = JSON.parse(questionDataElement.dataset.questions);
        // Only replace default questions if we actually got valid data
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            mcqQuestions = parsedQuestions;
        }
        console.log("Questions loaded:", mcqQuestions);
    }
} catch (error) {
    console.error("Error loading questions:", error);
    // Using fallback questions defined above
}

let currentQuestion = null;
let questionModal = null;
let overlay = null;

window.onload = function() {
    // Check if user is on mobile
    checkMobile();
    
    // Setup canvas
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    // Load all images
    loadImages();
    
    // Create MCQ modal and overlay
    createModalElements();

    // Draw start screen
    drawStartScreen();

    // Add event listeners
    setupEventListeners();
    
    // Add responsive design for mobile
    window.addEventListener("resize", resizeGame);
    resizeGame();
    
    // Load high score from local storage
    loadHighScore();
}

function checkMobile() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Update instructions based on device
    const instructions = document.querySelector('.instructions');
    if (instructions) {
        if (isMobile) {
            instructions.innerHTML = '<p>Tap the screen to jump</p>';
        } else {
            instructions.innerHTML = '<p>Press <span class="key">X</span> to start the game • Use <span class="key">X</span> to jump</p>';
        }
    }
}

function loadImages() {
    // Load dinosaur image
    dinoImg = new Image();
    dinoImg.src = "./img/dino.png";
    dinoImg.onload = function() {
        context.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
    }
    
    // Create running animation frames (assuming sprite sheet exists)
    // In real implementation, you'd have a sprite sheet with frames
    // For this example we'll just use the same image
    dinoRunFrames[0] = new Image();
    dinoRunFrames[0].src = "./img/dino.png";
    
    dinoRunFrames[1] = new Image();
    dinoRunFrames[1].src = "./img/dino.png";
    
    // Load cactus images
    cactus1Img = new Image();
    cactus1Img.src = "./img/cactus1.png";

    cactus2Img = new Image();
    cactus2Img.src = "./img/cactus2.png";

    cactus3Img = new Image();
    cactus3Img.src = "./img/cactus3.png";
}

function setupEventListeners() {
    // Keyboard events
    document.addEventListener("keydown", handleKeyDown);
    
    // Touch events for mobile
    document.addEventListener("touchstart", handleTouchStart);
    
    // Support jumping by clicking the game area
    board.addEventListener("click", function() {
        if (gameStarted && !gameOver && !countdownActive) {
            if (dino.y == dinoY) {
                // Jump
                velocityY = -10;
            }
        }
    });
}

function loadHighScore() {
    const savedScore = localStorage.getItem('dinoHighScore');
    if (savedScore) {
        highScore = parseInt(savedScore);
    }
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dinoHighScore', highScore);
    }
}

function resizeGame() {
    // Make the game responsive
    const gameContainer = document.querySelector(".game-container");
    const windowWidth = window.innerWidth;
    
    if (windowWidth < 768) { // Mobile devices
        const scale = Math.min(windowWidth / (boardWidth + 20), 1);
        if (gameContainer) {
            gameContainer.style.transform = `scale(${scale})`;
            gameContainer.style.transformOrigin = 'top center';
        }
    } else {
        if (gameContainer) {
            gameContainer.style.transform = 'scale(1)';
        }
    }
}

function createModalElements() {
    // Create overlay
    overlay = document.createElement("div");
    overlay.className = "overlay";
    document.body.appendChild(overlay);
    
    // Create modal
    questionModal = document.createElement("div");
    questionModal.className = "modal";
    questionModal.innerHTML = `
        <h2>Quick Question!</h2>
        <div class="question-text"></div>
        <div class="options-container"></div>
        <div class="result-container hide"></div>
        <div class="chances-info">Chances left: <span class="chances-count">${chancesLeft}</span></div>
    `;
    document.body.appendChild(questionModal);
}

function drawStartScreen() {
    context.fillStyle = "white";
    context.font = "30px 'Segoe UI'";
    context.textAlign = "center";
    
    // Add development notice
    context.fillStyle = "#FF6B6B";
    context.font = "16px 'Segoe UI'";
    context.fillText("This game is still under development. Sorry for bugs!", boardWidth/2, 30);
    
    context.fillStyle = "white";
    context.font = "30px 'Segoe UI'";
    
    if (isMobile) {
        context.fillText("Tap to Start", boardWidth/2, boardHeight/2);
    } else {
        context.fillText("Press 'X' to Start", boardWidth/2, boardHeight/2);
        context.font = "18px 'Segoe UI'";
        context.fillText("Use 'X' Key to Jump", boardWidth/2, boardHeight/2 + 40);
    }
    
    // Display high score
    if (highScore > 0) {
        context.font = "16px 'Segoe UI'";
        context.fillText(`High Score: ${highScore}`, boardWidth/2, boardHeight/2 + 80);
    }
}

function startCountdown(callback) {
    countdownActive = true;
    countdownValue = 3;
    
    function updateCountdown() {
        if (countdownValue > 0) {
            // Draw the game first
            drawGameState();
            
            // Draw semi-transparent overlay
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(0, 0, board.width, board.height);
            
            // Draw countdown number
            context.fillStyle = "white";
            context.font = "60px 'Segoe UI'";
            context.textAlign = "center";
            context.fillText(countdownValue, boardWidth/2, boardHeight/2);
            
            countdownValue--;
            setTimeout(updateCountdown, 1000);
        } else {
            // Draw the game first
            drawGameState();
            
            // Draw semi-transparent overlay
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(0, 0, board.width, board.height);
            
            // Show "GO!"
            context.fillStyle = "white";
            context.font = "60px 'Segoe UI'";
            context.textAlign = "center";
            context.fillText("GO!", boardWidth/2, boardHeight/2);
            
            setTimeout(() => {
                countdownActive = false;
                callback();
            }, 500);
        }
    }
    
    updateCountdown();
}

function drawGameState() {
    // Clear the canvas
    context.clearRect(0, 0, board.width, board.height);
    
    // Draw development notice
    context.fillStyle = "#FF6B6B";
    context.font = "16px 'Segoe UI'";
    context.textAlign = "center";
    context.fillText("This game is still under development. Sorry for bugs!", boardWidth/2, 30);
    
    // Draw ground line
    context.beginPath();
    context.moveTo(0, boardHeight - 20);
    context.lineTo(boardWidth, boardHeight - 20);
    context.strokeStyle = "#909090";
    context.stroke();
    
    // Draw dinosaur
    context.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
    
    // Draw cacti
    for (let i = 0; i < cactusArray.length; i++) {
        let cactus = cactusArray[i];
        context.drawImage(cactus.img, cactus.x, cactus.y, cactus.width, cactus.height);
    }
    
    // Draw score with gradient text
    context.fillStyle = "#9370db";
    context.font = "20px 'Segoe UI'";
    context.textAlign = "left";
    context.fillText("Score: " + score, 5, 20);
    
    // Display high score
    context.fillText("HI: " + highScore, boardWidth - 100, 20);
    
    // Display chances left
    context.fillText("Chances: " + chancesLeft, 5, 45);
}

function handleKeyDown(e) {
    if (!gameStarted && !countdownActive && e.key.toLowerCase() === 'x') {
        startCountdown(() => {
            startGame();
        });
        return;
    }
    
    if (gameStarted && !gameOver && !countdownActive) {
        if (e.key.toLowerCase() === 'x' && dino.y == dinoY) {
            // Jump
            velocityY = -10;
        }
    }
}

function handleTouchStart(e) {
    if (!gameStarted && !countdownActive) {
        startCountdown(() => {
            startGame();
        });
        return;
    }
    
    if (gameStarted && !gameOver && !countdownActive) {
        if (dino.y == dinoY) {
            // Jump on touch for mobile
            velocityY = -10;
            e.preventDefault(); // Prevent default touch behavior
        }
    }
}

function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    cactusArray = [];
    velocityX = initialVelocityX; // Reset to initial speed
    velocityY = 0;
    dino.y = dinoY;
    dinoImg.src = "./img/dino.png";
    
    // Start the game loop
    requestAnimationFrame(update);
    
    // Clear any existing intervals
    if (window.placeCactusInterval) {
        clearInterval(window.placeCactusInterval);
    }
    
    // Set new cactus spawning interval
    window.placeCactusInterval = setInterval(placeCactus, 1500); // Start with less frequent cacti
}

function update() {
    if (!gameStarted || countdownActive) {
        requestAnimationFrame(update);
        return;
    }
    
    if (gameOver) {
        requestAnimationFrame(update);
        return;
    }
    
    context.clearRect(0, 0, board.width, board.height);

    // Draw development notice
    context.fillStyle = "#FF6B6B";
    context.font = "16px 'Segoe UI'";
    context.textAlign = "center";
    context.fillText("This game is still under development. Sorry for bugs!", boardWidth/2, 30);

    // Draw ground line
    context.beginPath();
    context.moveTo(0, boardHeight - 20);
    context.lineTo(boardWidth, boardHeight - 20);
    context.strokeStyle = "#909090";
    context.stroke();

    // Dino physics
    velocityY += gravity;
    dino.y = Math.min(dino.y + velocityY, dinoY); // Apply gravity
    
    // Animate dinosaur running (every 5 frames)
    frameCount++;
    if (frameCount >= 5) {
        currentRunFrame = (currentRunFrame + 1) % 2;
        frameCount = 0;
    }
    
    // Draw dino - use running animation only when on ground
    if (dino.y === dinoY) {
        context.drawImage(dinoRunFrames[currentRunFrame], dino.x, dino.y, dino.width, dino.height);
    } else {
        context.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
    }

    // Handle cacti
    for (let i = 0; i < cactusArray.length; i++) {
        let cactus = cactusArray[i];
        cactus.x += velocityX;
        context.drawImage(cactus.img, cactus.x, cactus.y, cactus.width, cactus.height);

        if (detectCollision(dino, cactus)) {
            handleCollision();
        }
    }

    // Clean up off-screen cacti
    if (cactusArray.length > 0 && cactusArray[0].x < -cactusArray[0].width) {
        cactusArray.shift();
    }

    // Score display
    context.fillStyle = "#9370db";
    context.font = "20px 'Segoe UI'";
    context.textAlign = "left";
    score++;
    context.fillText("Score: " + score, 5, 20);
    
    // Display high score
    context.fillText("HI: " + highScore, boardWidth - 100, 20);
    
    // Display chances left
    context.fillText("Chances: " + chancesLeft, 5, 45);
    
    // Gradually increase speed based on score
    if (score % speedIncreaseInterval === 0) {
        // Make speed increase more gradual (0.1 units at a time)
        velocityX = Math.max(velocityX - 0.1, maxVelocity);
        
        // Also adjust cactus spawn rate based on score
        if (score > 2000 && window.placeCactusInterval) {
            clearInterval(window.placeCactusInterval);
            window.placeCactusInterval = setInterval(placeCactus, 1200);
        } else if (score > 5000 && window.placeCactusInterval) {
            clearInterval(window.placeCactusInterval);
            window.placeCactusInterval = setInterval(placeCactus, 1000);
        }
    }
    
    requestAnimationFrame(update);
}

function handleCollision() {
    gameOver = true;
    dinoImg.src = "./img/dino-dead.png";
    
    // Save high score
    saveHighScore();
    
    if (chancesLeft > 0) {
        // Show MCQ question
        showRandomQuestion();
    } else {
        // Game truly over
        context.fillStyle = "white";
        context.font = "30px 'Segoe UI'";
        context.textAlign = "center";
        context.fillText("Game Over", boardWidth/2, boardHeight/2);
        
        if (isMobile) {
            context.font = "20px 'Segoe UI'";
            context.fillText("Tap to restart", boardWidth/2, boardHeight/2 + 40);
        } else {
            context.font = "20px 'Segoe UI'";
            context.fillText("Press 'X' to restart", boardWidth/2, boardHeight/2 + 40);
        }
        
        context.font = "16px 'Segoe UI'";
        context.fillText(`Score: ${score} | High Score: ${highScore}`, boardWidth/2, boardHeight/2 + 80);
        
        gameStarted = false;
    }
}

function showRandomQuestion() {
    // Make sure we have questions available
    if (!mcqQuestions || mcqQuestions.length === 0) {
        console.error("No questions available to display");
        resumeGame(); // Skip the question if none available
        return;
    }
    
    // Select a random question
    currentQuestion = mcqQuestions[Math.floor(Math.random() * mcqQuestions.length)];
    
    // Guard against invalid question object
    if (!currentQuestion || !currentQuestion.question || !currentQuestion.options) {
        console.error("Invalid question object:", currentQuestion);
        resumeGame(); // Skip the question if invalid
        return;
    }
    
    // Update the modal with question
    const questionText = questionModal.querySelector(".question-text");
    questionText.textContent = currentQuestion.question;
    
    // Create option buttons
    const optionsContainer = questionModal.querySelector(".options-container");
    optionsContainer.innerHTML = '';
    
    currentQuestion.options.forEach(option => {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.textContent = option;
        button.onclick = () => checkAnswer(option);
        optionsContainer.appendChild(button);
    });
    
    // Reset and hide result container
    const resultContainer = questionModal.querySelector(".result-container");
    resultContainer.className = "result-container hide";
    
    // Update chances count
    questionModal.querySelector(".chances-count").textContent = chancesLeft;
    
    // Show modal and overlay
    overlay.classList.add("show");
    questionModal.classList.add("show");
}

function checkAnswer(selectedAnswer) {
    const resultContainer = questionModal.querySelector(".result-container");
    resultContainer.classList.remove("hide");
    
    if (selectedAnswer === currentQuestion.answer) {
        resultContainer.innerHTML = `
            <p style="color: #6BFF74; font-weight: bold;">Correct! You get another chance!</p>
            <button class="btn continue-btn">Continue</button>
            <p class="btn-info">Get ready for countdown!</p>
        `;
        
        // Setup continue button
        const continueBtn = resultContainer.querySelector(".continue-btn");
        continueBtn.onclick = () => {
            // Hide modal and start countdown
            overlay.classList.remove("show");
            questionModal.classList.remove("show");
            
            startCountdown(() => {
                resumeGame();
            });
        };
    } else {
        chancesLeft--;
        
        if (chancesLeft > 0) {
            resultContainer.innerHTML = `
                <p style="color: #FF6B6B; font-weight: bold;">Wrong! You died! The correct answer is ${currentQuestion.answer}</p>
                <button class="btn continue-btn">Try Again (${chancesLeft} chances left)</button>
                <p class="btn-info">Get ready for countdown!</p>
            `;
            
            // Update chances count
            questionModal.querySelector(".chances-count").textContent = chancesLeft;
            
            // Setup continue button
            const continueBtn = resultContainer.querySelector(".continue-btn");
            continueBtn.onclick = () => {
                // Hide modal and start countdown
                overlay.classList.remove("show");
                questionModal.classList.remove("show");
                
                // Restart game when wrong answer
                startCountdown(() => {
                    restartAfterWrongAnswer();
                });
            };
        } else {
            resultContainer.innerHTML = `
                <p style="color: #FF6B6B; font-weight: bold;">Wrong! You died! The correct answer is ${currentQuestion.answer}</p>
                <p>No chances left.</p>
                <button class="btn restart-btn">Restart Game</button>
            `;
            
            // Update chances count
            questionModal.querySelector(".chances-count").textContent = chancesLeft;
            
            const restartBtn = resultContainer.querySelector(".restart-btn");
            restartBtn.onclick = () => {
                // Hide modal
                overlay.classList.remove("show");
                questionModal.classList.remove("show");
                
                // Reset game
                chancesLeft = 10;
                gameStarted = false;
                
                // Display game over and wait for key press
                context.fillStyle = "white";
                context.font = "30px 'Segoe UI'";
                context.textAlign = "center";
                context.fillText("Game Over - No chances left", boardWidth/2, boardHeight/2);
                
                if (isMobile) {
                    context.font = "20px 'Segoe UI'";
                    context.fillText("Tap to restart", boardWidth/2, boardHeight/2 + 40);
                } else {
                    context.font = "20px 'Segoe UI'";
                    context.fillText("Press 'X' to restart", boardWidth/2, boardHeight/2 + 40);
                }
                
                context.font = "16px 'Segoe UI'";
                context.fillText(`Score: ${score} | High Score: ${highScore}`, boardWidth/2, boardHeight/2 + 80);
            };
        }
    }
}

function resumeGame() {
    gameOver = false;
    dinoImg.src = "./img/dino.png";
    resetGameState();
}

function restartAfterWrongAnswer() {
    // Completely restart the game but keep chances
    gameOver = false;
    score = 0;
    cactusArray = [];
    velocityX = initialVelocityX;
    velocityY = 0;
    dino.y = dinoY;
    dinoImg.src = "./img/dino.png";
    
    // Clear any existing intervals
    if (window.placeCactusInterval) {
        clearInterval(window.placeCactusInterval);
    }
    
    // Set new cactus spawning interval
    window.placeCactusInterval = setInterval(placeCactus, 1500);
}

function resetGameState() {
    // Reset dino position
    dino.y = dinoY;
    velocityY = 0;
    
    // Remove all cacti that are close to the player
    cactusArray = cactusArray.filter(cactus => cactus.x > dino.x + dino.width + 300);
    
    // Add a guaranteed safe zone by delaying new cactus placement
    clearInterval(window.placeCactusInterval);
    window.placeCactusInterval = null;
    
    // Restart cactus placement after a delay
    setTimeout(() => {
        if (!window.placeCactusInterval) {
            window.placeCactusInterval = setInterval(placeCactus, 1500);
        }
    }, 2000);
}

function placeCactus() {
    if (gameOver || !gameStarted || countdownActive) {
        return;
    }

    // Place cactus with some spacing
    const lastCactus = cactusArray.length > 0 ? cactusArray[cactusArray.length - 1] : null;
    
    // Only place a new cactus if there's enough space or no cactus exists
    if (!lastCactus || lastCactus.x < boardWidth - 250) { // More spacing between cacti
        // Calculate spacing based on current speed - faster speed means more space
        const spacingMultiplier = Math.min(Math.abs(velocityX) / Math.abs(initialVelocityX), 2);
        
        if (!lastCactus || lastCactus.x < boardWidth - (200 * spacingMultiplier)) {
            let cactus = {
                img: null,
                x: cactusX,
                y: cactusY,
                width: null,
                height: cactusHeight
            }

            let placeCactusChance = Math.random(); //0 - 0.9999...

            if (placeCactusChance > .85) { //15% you get cactus3
                cactus.img = cactus3Img;
                cactus.width = cactus3Width;
                cactusArray.push(cactus);
            }
            else if (placeCactusChance > .60) { //25% you get cactus2
                cactus.img = cactus2Img;
                cactus.width = cactus2Width;
                cactusArray.push(cactus);
            }
            else if (placeCactusChance > .40) { //20% you get cactus1
                cactus.img = cactus1Img;
                cactus.width = cactus1Width;
                cactusArray.push(cactus);
            }
            // 40% chance of no cactus - gives player breathing room

            if (cactusArray.length > 5) {
                cactusArray.shift(); // Remove the first element from the array
            }
        }
    }
}

function detectCollision(a, b) {
    // Add a smaller hitbox for better gameplay
    const hitboxReduction = 15; // Slightly more forgiving
    return a.x < b.x + b.width - hitboxReduction &&   
           a.x + a.width - hitboxReduction > b.x &&   
           a.y < b.y + b.height - hitboxReduction &&  
           a.y + a.height - hitboxReduction > b.y;    
}