export function popup(name, img) {
  // Add CSS for the popup to the existing stylesheet
  if (!document.getElementById("popup-styles")) {
    const styleElement = document.createElement("style");
    styleElement.id = "popup-styles";
    styleElement.textContent = `
        .game-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        
        .game-popup-overlay.active {
          opacity: 1;
          visibility: visible;
        }
        
        .game-popup {
          background-color: #1d1a2f;
          border-radius: 1rem;
          padding: 2rem;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 0 30px rgba(147, 112, 219, 0.4);
          transform: translateY(-20px);
          transition: transform 0.3s ease;
          position: relative;
        }
        
        .game-popup-overlay.active .game-popup {
          transform: translateY(0);
        }
        
        .game-popup-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: #a7a7a7;
          font-size: 1.5rem;
          cursor: pointer;
          transition: color 0.3s ease;
        }
        
        .game-popup-close:hover {
          color: #9370db;
        }
        
        .game-popup-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #333;
        }
        
        .game-popup-icon {
          width: 60px;
          height: 60px;
          border-radius: 0.5rem;
          object-fit: cover;
        }
        
        .game-popup-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #e7e7e7;
        }
        
        .game-popup-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .game-popup-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .game-popup-label {
          font-size: 0.9rem;
          color: #a7a7a7;
          font-weight: 500;
        }
        
        .game-popup-input, .game-popup-select {
          padding: 0.8rem 1rem;
          border-radius: 0.4rem;
          border: 1px solid #333;
          background-color: #0c0b19;
          color: #e7e7e7;
          font-size: 0.9rem;
          transition: border-color 0.3s ease;
        }
        
        .game-popup-input:focus, .game-popup-select:focus {
          outline: none;
          border-color: #9370db;
        }
        
        .game-popup-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .game-popup-cancel {
          padding: 0.8rem 1.5rem;
          background-color: transparent;
          border: 1px solid #333;
          border-radius: 0.4rem;
          color: #a7a7a7;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .game-popup-cancel:hover {
          border-color: #9370db;
          color: #e7e7e7;
        }
        
        .game-popup-start {
          padding: 0.8rem 1.5rem;
          background: linear-gradient(90deg, #6600c5, #9370db);
          border: none;
          border-radius: 0.4rem;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .game-popup-start:hover {
          box-shadow: 0 0 10px rgba(147, 112, 219, 0.5);
        }
      `;
    document.head.appendChild(styleElement);
  }

  // Remove any existing popup
  const existingPopup = document.getElementById("gamePopup");
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create the popup HTML structure
  const popupHTML = `
      <div class="game-popup-overlay" id="gamePopup">
        <div class="game-popup">
          <button class="game-popup-close">&times;</button>
          <div class="game-popup-header">
            <img src="${img}" alt="${name}" class="game-popup-icon">
            <h3 class="game-popup-title">${name}</h3>
          </div>
          <form class="game-popup-form" method="post" action="/${name
            .split("")
            .filter((c) => c !== " ")
            .join("")
            .toLowerCase()}" id="gameOptionsForm">
            <div class="game-popup-input-group">
              <label for="topicName" class="game-popup-label">Topic Name</label>
              <input type="text" id="topicName" name="topicName" class="game-popup-input" placeholder="Enter your topic" required>
            </div>
            <div class="game-popup-input-group">
              <label for="difficulty" class="game-popup-label">Select Difficulty</label>
              <select id="difficulty" name="difficulty" class="game-popup-select" required>
                <option value="">Choose difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div class="game-popup-buttons">
              <button type="button" class="game-popup-cancel">Cancel</button>
              <button type="submit" class="game-popup-start">Start Game</button>
            </div>
          </form>
        </div>
      </div>
    `;

  // Append the popup to the body
  document.body.insertAdjacentHTML("beforeend", popupHTML);

  // Get the popup elements (after they've been added to the DOM)
  const popup = document.getElementById("gamePopup");
  const closeButton = popup.querySelector(".game-popup-close");
  const cancelButton = popup.querySelector(".game-popup-cancel");
  const form = document.getElementById("gameOptionsForm");

  // Close popup function
  function closePopup() {
    popup.classList.remove("active");
    setTimeout(() => {
      popup.remove(); // Remove from DOM after transition
    }, 300);
  }

  // Add event listeners
  closeButton.addEventListener("click", closePopup);
  cancelButton.addEventListener("click", closePopup);

  // Close popup when clicking outside
  popup.addEventListener("click", function (e) {
    if (e.target === popup) {
      closePopup();
    }
  });

  // Form submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    document.querySelector(".game-popup-form").submit();
    //   const topicName = document.getElementById('topicName').value;
    //   const difficulty = document.getElementById('difficulty').value;

    //   // Here you would handle the game start with the selected options
    //   alert(`Starting ${name} game!\nTopic: ${topicName}\nDifficulty: ${difficulty}`);

    closePopup();
  });

  // Show the popup after everything is set up
  setTimeout(() => {
    popup.classList.add("active");
  }, 10);
}
