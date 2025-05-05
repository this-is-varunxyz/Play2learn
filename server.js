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


app.get("/games",async (req,res)=>{
   
    res.render("games");
});
app.get("/features",async (req,res)=>{
   
    res.render("feactures");

});
app.get("/about",(req,res)=>{
    res.render("about");
})
app.get("/contact",(req,res)=>{
    res.render("contact");
})

app.post("/hillclimb", async (req, res) => {
    // try {
    //     const csharpCode = await apicall("maths", "easy", "hillclimb");
    //     res.setHeader('Content-Type', 'text/plain');
    //     res.send(csharpCode);
    // } catch (error) {
    //     res.status(500).send("// API Error - Using fallback questions");
    // }
    answers = await apicall(req.body.topicName, req.body.difficulty, "hillclimb");
    res.send(`<body>${answers}<script> setTimeout(function() {
              window.location.href = "https://itch.io/hillclimb";
            }, 3000);</script></body>`)
});


app.get("/aiquestions",(req,res)=>{
res.send(`// Question 1
AddQuestion(
    "What is 5 + 3?",
    "8",
    new string[] {
        "5",
        "3",
        "15"
    }
);

// Question 2
AddQuestion(
    "What is 10 - 2?",
    "8",
    new string[] {
        "12",
        "5",
        "20"
    }
);

// Question 3
AddQuestion(
    "What is 2 * 4?",
    "8",
    new string[] {
        "6",
        "10",
        "24"
    }
);

// Question 4
AddQuestion(
    "What is 12 / 3?",
    "4",
    new string[] {
        "3",
        "15",
        "36"
    }
);

// Question 5
AddQuestion(
    "What is the next number in the sequence: 2, 4, 6, ...?",
    "8",
    new string[] {
        "7",
        "9",
        "10"
    }
);

// Question 6
AddQuestion(
    "How many sides does a triangle have?",
    "3",
    new string[] {
        "2",
        "4",
        "5"
    }
);

// Question 7
AddQuestion(
    "What is 10 / 5?",
    "2",
    new string[] {
        "5",
        "50",
        "15"
    }
);

// Question 8
AddQuestion(
    "What is 7 + 6?",
    "13",
    new string[] {
        "1",
        "12",
        "42"
    }
);

// Question 9
AddQuestion(
    "What is 9 - 4?",
    "5",
    new string[] {
        "13",
        "36",
        "4"
    }
);

// Question 10
AddQuestion(
    "What is 3 * 3?",
    "9",
    new string[] {
        "6",
        "1",
        "33"
    }
);`)
})


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
             
            return response.replace(/```csharp|```/g, "").trim();
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