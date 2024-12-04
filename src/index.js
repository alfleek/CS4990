import './styles.css';

const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    response_schema: {
    "type": "object",
    "properties": {
        "story": {"type": "string"},
        "firstoption": {"type": "string"},
        "secondoption": {"type": "string"},
        "name": {"type": "string"},
        "hp": {"type": "integer"},
        "location": {"type": "string"},
        "inventory": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "quantity": {"type": "integer"}
                },
                "required": ["name", "quantity"]
            }
        }
    },
    "required": ["story", "firstoption", "secondoption", "name", "hp", "location", "inventory"]
    }
};

const chatSession = model.startChat({
    generationConfig,
    history: [
    ],
});

async function generateAIResponse(input, player) {

    const result = await chatSession.sendMessage(input);
    console.log(result.response.text())
    return result.response.text();
    }


// Classes to represent the player and inventory
class Item {
constructor(name, quantity) {
    this.name = name;
    this.quantity = quantity;
}
}

class Player {
constructor(name, hp, location, inventory = []) {
    this.name = name;
    this.hp = hp;
    this.location = location;
    this.inventory = inventory;
}


}

// Initial game state

let currentStory = "";
let currentOptions = [];
let chatHistory = [];

const player = new Player("Adventurer", 100, "Crossroads", []);

try {
    const response = await generateAIResponse("You are a dungeon master operating a role playing game for the user. 'story' will contain your text responses. You will always provide two potentioal options for the user in every response, in 'firstoption' and 'secondoption'. For example: 'Search your surrounding for clues' Do not include these options in 'story'. Start by creating a blank player with 100 hp and prompting the player with 'Welcome, adventurer! You stand at the crossroads, your journey yet unwritten.  What kind of story do you want to embark on? A tale of daring heroism? A quest for ancient artifacts?  A dark and perilous descent into the underworld? Tell me your choice!'. From then on you will narrate the story and keep track of the player data", player);

    const parsedResponse = JSON.parse(response);

    // Update the game state
    currentStory = parsedResponse.story;
    currentOptions = [parsedResponse.firstoption, parsedResponse.secondoption];
    player.hp = parsedResponse.hp; // Assuming response has `hp` at root level
    player.location = parsedResponse.location;
    player.name = parsedResponse.name;
    player.inventory = parsedResponse.inventory


    
    

    // Refresh the UI
    chatHistory.push(currentStory)
    updateChatHistory();
    updateUI();
} catch (error) {
    console.error("Error handling option:", error);
    currentStory = error;
    currentOptions = ["Retry"];
    updateUI();
}



function updateUI() {
// Update the story
document.getElementById("story").innerText = currentStory;

// Update the options
const optionsContainer = document.getElementById("options");
optionsContainer.innerHTML = "";
currentOptions.forEach((option, index) => {
    const button = document.createElement("button");
    button.classList.add("option-button");
    button.innerText = option;
    button.onclick = () => handleOption(option);
    optionsContainer.appendChild(button);
});

// Add a text box for the third option
const textBoxOption = document.createElement("div");
textBoxOption.classList.add("textbox-option");

const inputField = document.createElement("input");
inputField.type = "text";
inputField.id = "text-input"; // Giving it an id to easily retrieve the value
inputField.placeholder = "Type your custom action...";

const submitButton = document.createElement("button");
submitButton.innerText = "Submit";
submitButton.onclick = () => handleOption(inputField.value); // Pass the input value when submitting

textBoxOption.appendChild(inputField);
textBoxOption.appendChild(submitButton);

optionsContainer.appendChild(textBoxOption);

// Update player stats
document.getElementById("player-name").innerText = `Player: ${player.name}`;
document.getElementById("player-hp").innerText = `HP: ${player.hp}`;
document.getElementById("player-inventory").innerText = `Inventory: ${player.inventory
    .map(item => `${item.name} x${item.quantity}`)
    .join(", ")}`;
}

async function handleOption(option) {
    try {
        chatHistory.push(option)
        const response = await generateAIResponse(option, player);

        const parsedResponse = JSON.parse(response);

        // Update the game state
        currentStory = parsedResponse.story;
        currentOptions = [parsedResponse.firstoption, parsedResponse.secondoption];
        player.hp = parsedResponse.hp; // Assuming response has `hp` at root level
        player.location = parsedResponse.location;
        player.name = parsedResponse.name;
        player.inventory = parsedResponse.inventory
        

        // Refresh the UI
        chatHistory.push(currentStory)
        updateChatHistory();
        updateUI();
    } catch (error) {
        console.error("Error handling option:", error);
        currentStory = error;
        currentOptions = ["Retry"];
        updateUI();
    }
}



// Function to update the chat history UI
function updateChatHistory() {
    const chatHistoryContainer = document.getElementById("chat-history");
    chatHistoryContainer.innerHTML = ""; // Clear the history container
    chatHistory.forEach(message => {
        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message");
        messageElement.innerText = message; // Display the message text
        chatHistoryContainer.appendChild(messageElement);
    });
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight; // Scroll to the bottom
}


// Initialize the game
updateChatHistory();
updateUI();