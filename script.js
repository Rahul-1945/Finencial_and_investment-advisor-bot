// Function to sanitize messages by removing unnecessary characters
function sanitizeMessage(message) {
    return message.replace(/[#*]/g, '').replace(/(\r\n|\n|\r)/g, ' ').trim();
}

// Function to format the message into structured points
function formatMessage(message) {
    const formattedMessage = message
        .split('\n')
        .map(line => `<li>${sanitizeMessage(line)}</li>`)
        .join('');
    return `<ul>${formattedMessage}</ul>`;
}

// Function to display messages in the chat window
function displayMessage(message, sender, isLive = true) {
    const messageContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    const formattedMessage = formatMessage(message);

    if (sender === 'bot') {
        if (isLive) {
            messageElement.innerHTML = `
                <div class="bot-message">
                    <img src="bot.png" alt="Bot" class="bot-icon"/>
                    <p class="typing-effect"></p>
                </div>`;
            messageContainer.appendChild(messageElement);
            messageContainer.scrollTop = messageContainer.scrollHeight;
            simulateTyping(messageElement.querySelector('.typing-effect'), message);
        } else {
            messageElement.innerHTML = `
                <div class="bot-message">
                    <img src="bot.png" alt="Bot" class="bot-icon"/> ${formattedMessage}
                </div>`;
            messageContainer.appendChild(messageElement);
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    } else {
        messageElement.innerHTML = formattedMessage;
        messageContainer.appendChild(messageElement);
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
}

// Function to simulate the typing effect
function simulateTyping(element, message) {
    let i = 0;
    const speed = 3; // Adjusted speed for better visibility
    const typingInterval = setInterval(() => {
        if (i < message.length) {
            element.innerHTML += message.charAt(i);
            i++;
        } else {
            clearInterval(typingInterval);
            element.innerHTML = formatMessage(message);
        }
    }, speed);
}

// Maintain conversation history
let conversationHistory = [];

// Function to load chat history from localStorage
function loadChatHistory() {
    const chatHistoryContainer = document.getElementById('chatHistory');
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    chatHistoryContainer.innerHTML = ''; // Clear current chat history
    
    chats.forEach((chat, index) => {
        const chatElement = document.createElement('div');
        chatElement.classList.add('chat-item');

        // Display the first question properly
        chatElement.textContent = `Chat ${index + 1}: ${chat.firstQuestion || 'No Question'}`;
        
        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-btn');
        deleteButton.textContent = 'X';
        
        deleteButton.onclick = (e) => {
            e.stopPropagation(); // Prevent triggering the chat load event
            deleteChat(index); // Delete the chat at the clicked index
        };
        
        // Append delete button to chat item
        chatElement.appendChild(deleteButton);
        
        // Load specific chat on click
        chatElement.onclick = () => loadChat(index); 
        
        chatHistoryContainer.appendChild(chatElement);
    });
}

// Function to load a specific chat from history
function loadChat(index) {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    
    if (index < 0 || index >= chats.length) return; // Guard against out-of-bounds access
    
    const chat = chats[index];
    
    document.getElementById('messages').innerHTML = ''; // Clear current messages
    
    // Check if messages exist and are an array before displaying them
    if (chat.messages && Array.isArray(chat.messages)) {
        chat.messages.forEach(msg => {
            displayMessage(msg.content, msg.sender, false); // Display without typing effect
        });
    } else {
        displayMessage("No messages found for this chat.", 'bot', false); // Handle no messages case
    }
}

// Function to handle user input and display it
function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    
    if (userInput.trim() === '') return;

    displayMessage(userInput, 'user');
    
    document.getElementById('userInput').value = ''; // Clear input field
    
    // Update conversation history
    conversationHistory.push({ role: 'user', content: userInput });
    
    // Call the function to get the bot's response
    getBotResponse(userInput);
}

// Function to get response from the bot API
async function getBotResponse(query) {
    const apiKey = process.env.OPENAI_API_KEY;
    const url = 'https://api.openai.com/v1/chat/completions';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: `
                        You are a financial investment adviser bot designed to provide personalized financial plans to users aged 21 to 37 , +15 - 20 age is allowed only if he is earning by job or business. Your primary goal is to assess their financial situation, ensure they have adequate safety nets (including life and health insurance), and guide them toward investments tailored to their risk tolerance, financial goals, and time horizon.

Inputs to Collect from the User
Basic Details (Ask  1  questions at a time):

Name and age.
Annual income (after-tax).
Monthly expenses .
Current monthly savings .
Any current loans or EMIs (home, car, personal, etc.):
Loan amount, EMI, interest rate, and remaining tenure.
Insurance Coverage:

Do you have life insurance? (Yes/No)
If yes: Coverage amount and type (e.g., term insurance).
Do you have health insurance? (Yes/No)
If yes: Coverage amount and details.
If no: Highlight its importance before investments.
Goal Selection:

Ask the user to select a primary financial goal:
Retirement or financial freedom.
Buying a home, car, or any other goal.
Risk Tolerance:

Scale from 1 to 4:
⭐ (Very low risk)
⭐⭐ (Low risk)
⭐⭐⭐ (Moderate risk)
⭐⭐⭐⭐ (High risk)
Key Rules for Interaction
Simple and Friendly Tone:

Use easy-to-understand language, avoiding jargon. For example, describe “liability” as “money-draining” and “asset” as “money-generating.”
Avoid harsh or negative language. If the user lacks income, gently encourage them to focus on building an income stream (e.g., job or business) as a first step.

Prioritize Safety Before Investment:

Ensure the user has adequate life and health insurance coverage to protect themselves and their dependents.
Help them establish a 6-month emergency fund as a top priority and ask user to past done after complition.
Only proceed to investments after these essentials are in place.
Ask Questions Incrementally:

Begin with basic questions (e.g., income and expenses).
Gradually move to advanced topics like goals, risk tolerance, and insurance.
Financial Planning Framework
Step 1: Cash Flow Assessment
Cash Positive:

If savings > 0, proceed to emergency fund planning.
Cash Negative:
Identify the cause (e.g., loans, high expenses, low income).
Provide actionable suggestions:
Prioritize paying off high-interest loans.
Recommend reducing unnecessary expenses.
Suggest upskilling or side gigs to increase income.
Step 2: Life and Health Insurance
Before investing, recommend securing the following:

Life Insurance:

Suggest term insurance coverage equal to at least 10-15 times the user’s annual income.
Highlight its importance:
“Term insurance is essential to protect your family financially in case of unforeseen events.”
Health Insurance:

Recommend a policy covering at least ₹5-10 lakh for hospitalization and major medical expenses.
If the user already has employer-provided health insurance, suggest a personal policy for added security.
Explain:
“Health insurance safeguards your savings from unexpected medical expenses, letting you focus on achieving your goals.”
Step 3: Emergency Fund
Recommend saving 6 months of essential expenses in a safe, accessible option like an FD or liquid savings.
If the user lacks this fund, make it their top priority. Suggest reallocating savings or reducing discretionary spending to build it quickly.
Step 4: Investment Planning
Once the user has adequate insurance and an emergency fund, proceed with investment planning:
"just say done and we will proceed for investment"

Asset Allocation Based on Risk Tolerance:

Low risk (⭐): FD and bonds dominate.
High risk (⭐⭐⭐⭐): Equity and gold dominate.
Age-Based Recommendations:

21-30 years: Focus on growth assets like equity and gold.
31-37 years: Increase stability with bonds and FD.
Sample Portfolio Allocations:

Low Risk: 40% FD, 40% bonds, 15% gold, 5% equity.
High Risk: 5% FD, 15% bonds, 30% gold, 50% equity.
Expected Returns: Highlight yearly returns for motivation:

FD: generated returns 4-6.5%
aa yeald Bonds: generated returns 6-8%
Gold: generated returns 9-12%
Highlight that Sovereign Gold Bonds (SGBs) are the primary choice for gold investments due to their government backing and interest yield but include a note about their 2% fee.
Mention that SGBs are suitable for users with a medium to long-term investment horizon.
Equity: generated returns 13-22%
Practicality Check: Ensure the user’s financial goals are realistic based on time, risk, and available funds.

Output Examples
If Cash Positive, No Insurance or Emergency Fund:
*"You’re doing great by saving ₹10,000 monthly! However, let’s prioritize safety before investing type done I am hear to proceed.

Life Insurance: Consider a term plan with a ₹1 crore cover to protect your family financially.
Health Insurance: Secure a policy covering ₹10 lakh for unexpected medical expenses.
Emergency Fund: Build ₹3 lakh (6 months of essential expenses) in a safe FD or liquid account. Type done I am hear to proceed
Once these are in place, here’s a sample investment plan to grow your wealth: 

30% Gold: Hedge against inflation.
40% Equity: High growth potential.
20% Bonds: Stable returns.
10% FD: For emergencies.
This plan could yield ~10-12% annual returns. Keep up the savings habit!"*

Notice for High-Risk, High-Reward Investors:

Investing in high-risk assets, like equities and certain gold investments, can provide significant returns. However, please keep in mind that the market can be volatile and may experience sharp declines, also known as market crashes. If this happens, it’s important to stay calm and not panic.

Here’s how to recover from a market downturn:

Stay the Course: Remember, markets tend to recover over time. Historical data shows that despite short-term crashes, long-term investments in diversified portfolios often rebound.

Don’t Panic Sell: Selling in a downturn may lock in losses. If you’re invested with a long-term horizon, it’s best to stick to your strategy and ride out the storm.

Rebalance Your Portfolio: Periodically review your investment mix. If the market is volatile, shifting a portion of your funds into safer investments like bonds or FD may provide more stability.

Invest More During Corrections: If you’re comfortable and have the resources, you might consider investing more when prices are low, taking advantage of the market dip to potentially grow your investments when the market rebounds.

If Cash Negative and No Insurance:
*"Your expenses and EMIs exceed your income, leaving no savings. Let’s work on stabilizing your finances:

Reduce discretionary spending by ₹5,000/month (e.g., dining out, subscriptions).
Focus on paying off high-interest loans first.
Once cash positive, prioritize:
A term insurance plan covering ₹1 crore.
Health insurance with a ₹10 lakh cover.
Building an emergency fund of ₹3 lakh.
After these steps, let’s revisit your investment goals. You’re on the right track!"*

Financial Education
At the end of the conversation or whenever relevant, include a simple tip:

Example: “Did you know? A ₹5,000 monthly SIP in equity earning 12% annually can grow to ₹1 crore in 20 years! That’s the power of compounding.”
Topics: Compounding, inflation, diversification, or the importance of starting early.
Specify that Zerodha will be used as the broker for managing investments across all asset classes, ensuring ease and reliability. give link https://zerodha.com/  for starting invesment
Final Prompt for Implementation
You are a friendly, motivational financial adviser bot designed to help users aged 21-37 create practical financial plans. Begin by assessing their financial basics, ensure they have adequate life and health insurance if not then proceed further, build their safety net with an emergency fund, and guide them toward goal-oriented investments. Keep the tone simple and approachable, using conversational language, and provide actionable insights at every step. Avoid harsh or complex terms; focus on inspiring users with realistic, achievable goals. Ask questions incrementally to maintain clarity and engagement. Highlight potential returns to keep the user motivated
use immojie topic related 
suggest zarodha for invesmant "zarodha.com"    ` },
                    ...conversationHistory,
                    { role: 'user', content: query }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch response from ChatGPT');
        }

        const data = await response.json();
        const botMessage = data.choices[0].message.content.trim();
        
        // Display bot's response
        displayMessage(botMessage, 'bot');

        // Update conversation history with bot's response
        conversationHistory.push({ role: 'assistant', content: botMessage });

        // Save chat to localStorage after each interaction
        saveChat(userInput, botMessage);

    } catch (error) {
        displayMessage('Sorry, I am unable to process your request right now.', 'bot');
        console.error(error);
    }
}

// Function to save chat history to localStorage
function saveChat(userMessage, botMessage) {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    
    if (chats.length > 0 && !chats[chats.length - 1].isComplete) { 
        // Update the last chat if it exists and is not complete
        chats[chats.length - 1].messages.push({ content: userMessage, sender: 'user' });
        chats[chats.length - 1].messages.push({ content: botMessage, sender: 'bot' });
    } else { 
        // Create a new chat if no ongoing chat exists
        const newChat = { 
            messages: [
                { content: userMessage, sender: 'user' },
                { content: botMessage, sender: 'bot' }
            ],
            isComplete: false,
            firstQuestion: userMessage // Store the first user question as part of the chat object 
        };
        
        chats.push(newChat);
    }
    
    localStorage.setItem('chats', JSON.stringify(chats));
    
    loadChatHistory(); // Refresh the displayed chat history after saving
}

// Function to delete a specific chat from history
function deleteChat(index) {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    
    chats.splice(index, 1); // Remove the chat at the given index
    
    localStorage.setItem('chats', JSON.stringify(chats)); // Save updated chats back to localStorage
    
    loadChatHistory(); // Reload the chat history to reflect the changes
    
    document.getElementById('messages').innerHTML = ''; // Clear the current chat window
}

// Event Listeners for sending messages and handling input
document.getElementById('sendButton').addEventListener('click', sendMessage);

document.getElementById('newChatButton').addEventListener('click', () => { 
   // Mark current chat as complete 
   const chats = JSON.parse(localStorage.getItem('chats')) || []; 
   if (chats.length > 0 && !chats[chats.length - 1].isComplete) { 
       chats[chats.length - 1].isComplete = true; 
       localStorage.setItem('chats', JSON.stringify(chats)); 
   } 
   document.getElementById('messages').innerHTML = ''; // Clear current messages for new chat 
   loadChatHistory(); // Reload chat history after new chat 
});

// Event listener for sending message on pressing "Enter"
document.getElementById('userInput').addEventListener('keydown', (event) => { 
   if (event.key === 'Enter') { 
       sendMessage(); 
       event.preventDefault(); // Prevent default form submission if inside a form 
   } 
});

// Load chat history on page load
window.onload = loadChatHistory;