const express = require('express');
const path = require('path');
const fs = require('fs');
// Import the Google AI SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.set("view engine",'ejs');
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({ extended: true }));

// Initialize the Google AI SDK with your API key
// You'll need to get an API key from Google AI Studio
const API_KEY = "AIzaSyCeAOXfShz1_wWxUBGzyyjLl1NQhO25b6U"; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(API_KEY);


app.get("/",(req,res)=>{
    res.render("index");
});


app.post("/login", (req, res) => {
    // Access the username from the request body
   
    
    // Render the games view with the username
    res.render("games");
  });
app.get("/games",async (req,res)=>{
   
    res.render("games");
});
app.get("/features",async (req,res)=>{
   
    res.render("feactures");
});


app.post("/:gamename",async (req,res)=>{
    let difficulty = req.body.difficulty;
    let topicName = req.body.topicName;
    try {
        let questions = await apicall(topicName, difficulty);
        console.log("sending");
        console.log(questions)
        
        res.render(req.params.gamename,{ questions: JSON.stringify(questions)});
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).send({ error: "Failed to generate questions" });
    }
});



app.get("/aiquestions",async (req,res)=>{

    let answer = await apicall("economics","easy","hillclimb");
    console.log(answer);
    res.send(answer)



})


async function apicall(topicName, difficulty, gameName = "") {
    try {
        // Create model instance with appropriate settings for text generation
        const textModel = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 2048,
            },
        });
        
        let prompt;
        
        // Check if the game name is Hill Climb Racing
        if (gameName.toLowerCase() === "hillclimb") {
            // Construct the prompt for AddQuestion format
            prompt = `Generate 10 multiple choice questions about ${topicName} with ${difficulty} difficulty level.
            
            Format each question using the AddQuestion syntax as shown below:
            
            // Question X
            AddQuestion(
                "Question text here?",
                "Correct answer here",
                new string[] {
                    "Wrong option 1",
                    "Wrong option 2",
                    "Wrong option 3"
                }
            );
            
            Make sure that:
            1. Each question has exactly 1 correct answer and 3 wrong options
            2. The correct answer should be the second parameter in the AddQuestion function
            3. Questions should be appropriate for the ${difficulty} difficulty level
            4. All 10 questions must be about ${topicName}
            5. Do not include any explanations, just the AddQuestion blocks
            6. Use proper C# syntax with correct string formatting and commas`;
        } else {
            // Use the original JSON format prompt
            prompt = `Generate 10 multiple choice questions about ${topicName} with ${difficulty} difficulty level.
            
            Your response must be ONLY a valid JSON array with NO text outside the JSON structure.
            
            Return EXACTLY in this format with no comments, explanations, backticks, or markdown:
            [
              {
                "question": "Question text here?",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "answer": "Correct option here"
              },
              ...more questions
            ]
            
            Make sure that:
            1. Each question has exactly 4 options
            2. The answer must be exactly one of the options
            3. Questions should be appropriate for the ${difficulty} difficulty level
            4. All 10 questions must be about ${topicName}
            5. Format must be valid JSON that can be parsed with JSON.parse()`;
        }
        
        // Generate content
        const result = await textModel.generateContent({
            contents: [{ parts: [{ text: prompt }] }],
        });
        
        let response = result.response.text();
        
        // Process response based on format
        if (gameName.toLowerCase() === "hillclimb") {
            // For Hill Climb, we return the code directly
            return response.trim();
        } else {
            // For regular format, we clean and parse JSON
            response = cleanJsonResponse(response);
            const questions = JSON.parse(response);
            return questions;
        }
    } catch (error) {
        console.error("Error in API call:", error);
        throw error; // Re-throw so the route handler can catch it
    }
}

function cleanJsonResponse(response) {
    // Remove code blocks, backticks, and "json" labels
    let cleaned = response.replace(/```json|```/g, "").trim();
    
    // Try to extract just the JSON array if other text is present
    try {
        const jsonStart = cleaned.indexOf("[");
        const jsonEnd = cleaned.lastIndexOf("]") + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
            cleaned = cleaned.substring(jsonStart, jsonEnd);
        }
        
        // Validate it parses as JSON
        JSON.parse(cleaned);
        return cleaned;
    } catch (e) {
        console.error("JSON parsing error:", e);
        throw new Error("Failed to parse AI response as valid JSON");
    }
}

// function cleanJsonResponse(response) {
//     // Remove code blocks, backticks, and "json" labels
//     let cleaned = response.replace(/```json|```/g, "").trim();
    
//     // Try to extract just the JSON array if other text is present
//     try {
//         const jsonStart = cleaned.indexOf("[");
//         const jsonEnd = cleaned.lastIndexOf("]") + 1;
        
//         if (jsonStart >= 0 && jsonEnd > jsonStart) {
//             cleaned = cleaned.substring(jsonStart, jsonEnd);
//         }
        
//         // Validate it parses as JSON
//         JSON.parse(cleaned);
//         return cleaned;
//     } catch (e) {
//         console.error("JSON parsing error:", e);
//         throw new Error("Failed to parse AI response as valid JSON");
//     }
// }

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`http://localhost:3000/`);
});