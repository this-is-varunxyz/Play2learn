// Board & Game Settings
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

// Game state variables
let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = 0;
let animationId;
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Bird properties
let birdWidth = 34;
let birdHeight = 24;
let birdX = boardWidth/8;
let birdY = boardHeight/2;
let birdImg;
let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
}

// Pipes properties
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;
let pipeInterval;
let topPipeImg;
let bottomPipeImg;

// Physics settings
let velocityX = -2; // pipes moving left speed
let velocityY = 0; // bird jump speed
let gravity = 0.4;

// Game difficulty scaling
let gameSpeed = 1;
let gameSpeedIncrement = 0.0001;
let maxGameSpeed = 1.5;

// Countdown variables
let countdownActive = false;
let countdownValue = 3;

// Recovery mode variables after correct answer
let recoveryMode = false;
let recoveryTimeRemaining = 0;
let recoveryTotalTime = 3; // seconds of recovery time
let pipeSpawnDelay = 0; // delay before pipes spawn again

let questions = [];
try {
    // Parse the questions from the EJS template variable
    questions = JSON.parse(document.getElementById('question-data').dataset.questions);
    console.log("Questions loaded:", questions);
} catch (error) {
    console.error("Error loading questions:", error);
    // Fallback questions in case API fails
}

let currentQuestion = null;
let showingQuestion = false;
let questionIndex = 0;
let maxQuestions = 10; // Max questions before game over

window.onload = function() {
    // Set up responsive canvas
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    
    // Load game images
    loadImages();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial draw of start screen
    drawStartScreen();
}

console.log("flappy bird game is running")
function setupCanvas() {
    board = document.getElementById("board");
    
    // Make canvas responsive
    if (window.innerWidth <= 768) {
        // Mobile size
        boardWidth = Math.min(window.innerWidth - 20, 360);
        boardHeight = Math.min(window.innerHeight - 200, 640);
    } else {
        // Desktop size
        boardWidth = 360;
        boardHeight = 640;
    }
    
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");
    
    // Reset bird position with new dimensions
    birdX = boardWidth/8;
    birdY = boardHeight/2;
    bird.x = birdX;
    bird.y = birdY;
}

function loadImages() {
    birdImg = new Image();
    birdImg.src = "./flappybird.png";
    
    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";
    
    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";
}

function setupEventListeners() {
    // Keyboard controls for X key only
    document.addEventListener("keydown", function(e) {
        if (e.code === "KeyX") {
            if (!gameStarted) {
                if (!countdownActive) {
                    startCountdown(() => startGame());
                }
            } else {
                handleJump();
            }
        }
    });
    
    // Touch controls for mobile
    board.addEventListener("touchstart", function(e) {
        if (!gameStarted) {
            if (!countdownActive) {
                startCountdown(() => startGame());
            }
        } else {
            handleJump();
        }
        e.preventDefault(); // Prevent default touch behavior
    });
    
    // Mouse controls (for both)
    board.addEventListener("click", function() {
        if (!gameStarted) {
            if (!countdownActive) {
                startCountdown(() => startGame());
            }
        } else {
            handleJump();
        }
    });
    
    // Handle buttons
    document.getElementById("restart-button").addEventListener("click", prepareRestart);
    document.getElementById("continue-button").addEventListener("click", continueGame);
}

function startCountdown(callback) {
    countdownActive = true;
    countdownValue = 3;
    
    function updateCountdown() {
        if (countdownValue > 0) {
            // Draw background state first
            context.fillStyle = "#1a1a2e";
            context.fillRect(0, 0, boardWidth, boardHeight);
            
            // Draw bird
            context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
            
            // Draw existing pipes if any (but not in recovery mode)
            if (!recoveryMode) {
                for (let i = 0; i < pipeArray.length; i++) {
                    let pipe = pipeArray[i];
                    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
                }
            }
            
            // Add semi-transparent overlay
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(0, 0, boardWidth, boardHeight);
            
            // Draw countdown
            context.fillStyle = "white";
            context.font = "60px 'Segoe UI', sans-serif";
            context.textAlign = "center";
            context.fillText(countdownValue, boardWidth/2, boardHeight/2);
            
            countdownValue--;
            setTimeout(updateCountdown, 1000);
        } else {
            // Draw "GO!"
            // Draw background state first
            context.fillStyle = "#1a1a2e";
            context.fillRect(0, 0, boardWidth, boardHeight);
            
            // Draw bird
            context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
            
            // Draw existing pipes if any (but not in recovery mode)
            if (!recoveryMode) {
                for (let i = 0; i < pipeArray.length; i++) {
                    let pipe = pipeArray[i];
                    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
                }
            }
            
            // Add semi-transparent overlay
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(0, 0, boardWidth, boardHeight);
            
            context.fillStyle = "white";
            context.font = "60px 'Segoe UI', sans-serif";
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

function startGame() {
    if (gameOver) return;
    gameStarted = true;
    
    // Start the game loop
    requestAnimationFrame(update);
    
    // Only start pipe interval if not in recovery mode
    if (!recoveryMode) {
        startPipeGeneration();
    }
}

function startPipeGeneration() {
    // Clear any existing interval first
    clearInterval(pipeInterval);
    pipeInterval = setInterval(placePipes, 1500);
}

function drawStartScreen() {
    // Draw background
    context.fillStyle = "#1a1a2e";
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    // Draw bird
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    
    // Draw instructions
    context.fillStyle = "white";
    context.font = "24px 'Segoe UI', sans-serif";
    context.textAlign = "center";
    
    context.fillText("Press 'X' to Start", boardWidth/2, boardHeight/2 - 50);
    
    if (isMobile) {
        context.font = "18px 'Segoe UI', sans-serif";
        context.fillText("or Tap Screen", boardWidth/2, boardHeight/2 - 20);
    }
    
    // Display high score
    context.font = "16px 'Segoe UI', sans-serif";
    context.fillText("High Score: " + highScore, boardWidth/2, boardHeight/2 + 100);
    
    context.textAlign = "left"; // Reset alignment
}

function handleJump() {
    if (gameOver || showingQuestion || countdownActive) {
        return;
    }
    
    // Jump physics
    velocityY = -6;
}

function update() {
    animationId = requestAnimationFrame(update);
    
    if (showingQuestion || !gameStarted || countdownActive) {
        return;
    }
    
    // Clear canvas
    context.clearRect(0, 0, board.width, board.height);
    
    // Draw background
    context.fillStyle = "#1a1a2e";
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    // Handle recovery mode countdown
    if (recoveryMode) {
        recoveryTimeRemaining -= 1/60; // Assuming 60fps
        
        // Show recovery timer
        context.fillStyle = "white";
        context.font = "18px 'Segoe UI', sans-serif";
        context.textAlign = "center";
        context.fillText("Recovery Time: " + Math.ceil(recoveryTimeRemaining) + "s", boardWidth/2, 40);
        
        if (recoveryTimeRemaining <= 0) {
            // End recovery mode
            recoveryMode = false;
            // Start spawning pipes again
            startPipeGeneration();
        }
    } else {
        // Normal game - increase difficulty over time
        gameSpeed = Math.min(gameSpeed + gameSpeedIncrement, maxGameSpeed);
    }
    
    // Apply physics to bird
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
    
    // Draw bird
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    
    // Check if bird hit the bottom
    if (bird.y > board.height) {
        handleGameOver();
        return;
    }
    
    // Update and draw pipes (only if not in recovery mode)
    if (!recoveryMode) {
        for (let i = 0; i < pipeArray.length; i++) {
            let pipe = pipeArray[i];
            pipe.x += velocityX * gameSpeed;
            context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
            
            // Check for score
            if (!pipe.passed && bird.x > pipe.x + pipe.width) {
                score += 0.5;
                pipe.passed = true;
            }
            
            // Check for collision
            if (detectCollision(bird, pipe)) {
                handleGameOver();
                return;
            }
        }
        
        // Remove off-screen pipes
        while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
            pipeArray.shift();
        }
    }
    
    // Draw score
    context.fillStyle = "white";
    context.font = "30px 'Segoe UI', sans-serif";
    context.fillText(score, 10, 40);
    
    // Draw high score
    context.font = "16px 'Segoe UI', sans-serif";
    context.fillText("High Score: " + highScore, 10, 70);
    
    // If in recovery mode, draw message
    if (recoveryMode) {
        context.fillStyle = "rgba(0, 255, 0, 0.3)";
        context.fillRect(0, boardHeight/2 - 40, boardWidth, 80);
        
        context.fillStyle = "white";
        context.font = "24px 'Segoe UI', sans-serif";
        context.textAlign = "center";
        context.fillText("Safe Zone!", boardWidth/2, boardHeight/2);
        context.font = "16px 'Segoe UI', sans-serif";
        context.fillText("Pipes paused for " + Math.ceil(recoveryTimeRemaining) + "s", boardWidth/2, boardHeight/2 + 30);
        
        context.textAlign = "left"; // Reset text alignment
    }
}

function placePipes() {
    if (gameOver || showingQuestion || !gameStarted || countdownActive || recoveryMode) {
        return;
    }
    
    let randomPipeY = pipeY - pipeHeight/4 - Math.random()*(pipeHeight/2);
    let openingSpace = board.height/4;
    
    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(topPipe);
    
    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(bottomPipe);
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function handleGameOver() {
    gameOver = true;
    gameStarted = false;
    
    // Stop pipe generation
    clearInterval(pipeInterval);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("flappyHighScore", highScore);
    }
    
    // Check if we've asked enough questions
    if (questionIndex >= maxQuestions) {
        showFinalGameOver();
    } else {
        showQuestion();
    }
}

function showQuestion() {
    showingQuestion = true;
    questionIndex++;
    
    // Get a random question
    let randomIndex = Math.floor(Math.random() * questions.length);
    currentQuestion = questions[randomIndex];
    
    // Show question modal
    document.getElementById("question-text").textContent = currentQuestion.question;
    
    let optionsContainer = document.getElementById("question-options");
    optionsContainer.innerHTML = "";
    
    currentQuestion.options.forEach(option => {
        let button = document.createElement("button");
        button.textContent = option;
        button.classList.add("option-btn");
        button.addEventListener("click", function() {
            checkAnswer(option);
        });
        optionsContainer.appendChild(button);
    });
    
    // Show the modal
    document.getElementById("question-modal").classList.add("show");
    document.getElementById("overlay").classList.add("show");
}

function checkAnswer(selectedAnswer) {
    let resultMessage = document.getElementById("result-message");
    let resultContainer = document.getElementById("result-container");
    let questionContainer = document.getElementById("question-container");
    
    // Hide question, show result
    questionContainer.classList.add("hide");
    resultContainer.classList.remove("hide");
    
    if (selectedAnswer === currentQuestion.answer) {
        // Correct answer
        resultMessage.textContent = "Correct! You get another chance with a safe zone!";
        document.getElementById("continue-button").classList.remove("hide");
        document.getElementById("restart-button").classList.add("hide");
    } else {
        // Wrong answer
        resultMessage.textContent = "Wrong! The correct answer was: " + currentQuestion.answer;
        document.getElementById("continue-button").classList.add("hide");
        document.getElementById("restart-button").classList.remove("hide");
    }
}

function showFinalGameOver() {
    // Show final game over message without question
    let gameOverModal = document.getElementById("gameover-modal");
    let scoreDisplay = document.getElementById("final-score");
    
    scoreDisplay.textContent = score;
    gameOverModal.classList.add("show");
    document.getElementById("overlay").classList.add("show");
}

function continueGame() {
    // Reset modal
    resetModal();
    
    // Clear all pipes before continuing
    pipeArray = [];
    
    // Enable recovery mode - no pipes for a few seconds
    recoveryMode = true;
    recoveryTimeRemaining = recoveryTotalTime;
    
    // Clear any existing pipe interval
    clearInterval(pipeInterval);
    
    // Continue game with countdown
    showingQuestion = false;
    gameOver = false;
    bird.y = birdY;
    velocityY = 0;
    
    // Start countdown before continuing
    startCountdown(() => {
        gameStarted = true;
    });
}

function prepareRestart() {
    // Reset modal
    resetModal();
    
    // Reset game but don't start until player presses X
    showingQuestion = false;
    gameOver = false;
    gameStarted = false;
    bird.y = birdY;
    pipeArray = [];
    score = 0;
    velocityY = 0;
    gameSpeed = 1;
    questionIndex = 0;
    recoveryMode = false;
    
    // Clear any previous animation frame
    cancelAnimationFrame(animationId);
    clearInterval(pipeInterval);
    
    // Draw the start screen
    drawStartScreen();
}

function restartGame() {
    prepareRestart();
    
    // Start countdown before starting game
    startCountdown(() => startGame());
}

function resetModal() {
    // Hide all modals
    document.getElementById("question-modal").classList.remove("show");
    document.getElementById("gameover-modal").classList.remove("show");
    document.getElementById("overlay").classList.remove("show");
    
    // Reset containers
    document.getElementById("question-container").classList.remove("hide");
    document.getElementById("result-container").classList.add("hide");
}

// Load high score from local storage
window.addEventListener("DOMContentLoaded", function() {
    let savedHighScore = localStorage.getItem("flappyHighScore");
    if (savedHighScore !== null) {
        highScore = parseInt(savedHighScore);
    }
});