import axios from "axios";

const geminiResponse = async (command, assistantName, userName) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in .env");
    }

    const prompt = `
You are "${assistantName}", a sophisticated virtual assistant created by ${userName}.
Your task is to understand user intent and return structured JSON.

CRITICAL: You MUST return ONLY valid JSON. No other text before or after.

Return JSON in this EXACT structure:
{
  "type": "<intent_type>",
  "userInput": "<exact_user_input>",
  "response": "<friendly_spoken_response>",
  "searchQuery": "<extracted_search_terms_if_applicable>",
  "action": "<specific_action_if_needed>",
  "parameters": {
    "url": "<url_if_applicable>",
    "app": "<app_name_if_applicable>",
    "location": "<location_if_needed>",
    "time": "<time_if_scheduling>"
  }
}

AVAILABLE TYPES (choose the MOST specific one):

--- INFORMATION TYPES ---
"time_current": User asks for current time
"date_current": User asks for today's date
"day_current": User asks for current day of week
"month_current": User asks for current month
"year_current": User asks for current year
"weather": User asks about weather
"news": User asks for news
"fact": User wants a random fact
"definition": User wants definition of a word
"calculation": Mathematical calculation needed
"conversion": Unit conversion needed
"joke": User wants a joke
"quote": User wants an inspirational quote
"compliment": User wants a compliment
"advice": User wants advice

--- SEARCH TYPES ---
"google_search": Search on Google
"youtube_search": Search on YouTube
"youtube_play": Play specific video on YouTube
"amazon_search": Search on Amazon
"wikipedia_search": Search on Wikipedia
"map_search": Search location on maps
"image_search": Search for images
"recipe_search": Search for recipes

--- APPLICATION TYPES ---
"app_open": Open any application
"calculator_open": Open calculator
"calendar_open": Open calendar
"email_open": Open email
"email_compose": Compose new email
"notes_open": Open notes app
"reminder_set": Set a reminder
"alarm_set": Set an alarm
"timer_set": Set a timer
"meeting_schedule": Schedule a meeting

--- SOCIAL MEDIA TYPES ---
"instagram_open": Open Instagram
"facebook_open": Open Facebook
"twitter_open": Open Twitter
"whatsapp_open": Open WhatsApp
"linkedin_open": Open LinkedIn
"reddit_open": Open Reddit
"discord_open": Open Discord

--- ENTERTAINMENT TYPES ---
"music_play": Play music
"video_play": Play video
"movie_search": Search for movies
"game_open": Open game
"podcast_play": Play podcast
"radio_play": Play radio station

--- PRODUCTIVITY TYPES ---
"file_open": Open file
"document_create": Create document
"presentation_create": Create presentation
"spreadsheet_open": Open spreadsheet
"translate": Translate text
"spell_check": Check spelling
"grammar_check": Check grammar

--- SYSTEM TYPES ---
"settings_open": Open settings
"help_request": User needs help
"feedback_give": User giving feedback
"bug_report": User reporting bug
"feature_request": User requesting feature

--- CONVERSATIONAL TYPES ---
"greeting": Greeting (hi, hello)
"farewell": Goodbye (bye, goodbye)
"thanks": Thank you
"apology": User apologizing
"self_intro": User asks about you
"creator_info": User asks who created you
"capabilities": User asks what you can do
"status_check": User asks how you are
"small_talk": Casual conversation

--- COMMAND TYPES ---
"assistant_name_change": Change assistant name
"assistant_image_change": Change assistant image
"preferences_change": Change user preferences
"history_clear": Clear history
"data_export": Export user data
"account_manage": Manage account settings

RULES:
1. Extract search terms for search types
2. For "what is", "who is", "how to" → Use "google_search" or "wikipedia_search"
3. For "play [song]" → Use "music_play"
4. For "show me" → Determine context (images, videos, info)
5. For "open [app]" → Use specific app type if available, else "app_open"
6. ALWAYS include a friendly, natural spoken response
7. Use "${userName}" when appropriate
8. For calculations, include the answer in response
9. For conversions, include the result in response
10. Keep responses concise but helpful

EXAMPLES:
User: "What's the weather in London?"
Output: {
  "type": "weather",
  "userInput": "What's the weather in London?",
  "response": "I'll check the weather in London for you.",
  "searchQuery": "London weather",
  "action": "search_weather",
  "parameters": { "location": "London" }
}

User: "Play Bohemian Rhapsody on YouTube"
Output: {
  "type": "youtube_play",
  "userInput": "Play Bohemian Rhapsody on YouTube",
  "response": "Playing Bohemian Rhapsody on YouTube now.",
  "searchQuery": "Bohemian Rhapsody",
  "action": "play_video",
  "parameters": { "app": "youtube", "video": "Bohemian Rhapsody" }
}

User: "Set alarm for 7 AM tomorrow"
Output: {
  "type": "alarm_set",
  "userInput": "Set alarm for 7 AM tomorrow",
  "response": "I'll set an alarm for 7 AM tomorrow.",
  "searchQuery": null,
  "action": "set_alarm",
  "parameters": { "time": "7:00", "date": "tomorrow" }
}

User: "How to make pasta?"
Output: {
  "type": "recipe_search",
  "userInput": "How to make pasta?",
  "response": "Searching for pasta recipes for you.",
  "searchQuery": "pasta recipe",
  "action": "search_recipes",
  "parameters": { "dish": "pasta" }
}

User: "What can you do?"
Output: {
  "type": "capabilities",
  "userInput": "What can you do?",
  "response": "I can help you with searches, opening apps, setting reminders, answering questions, playing media, and much more!",
  "searchQuery": null,
  "action": "list_capabilities",
  "parameters": {}
}

Now process: "${command}"
`;

    const response = await axios.post(
      `${apiUrl}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!text) {
      console.warn("Gemini returned empty response");
      return null;
    }

    // Clean and parse JSON
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();
      
      // Parse JSON
      const parsed = JSON.parse(cleanText);
      
      // Validate required fields
      if (!parsed.type || !parsed.userInput || !parsed.response) {
        throw new Error("Missing required fields in response");
      }
      
      return parsed;
    } catch (err) {
      console.warn("Failed to parse Gemini response as JSON:", err.message);
      console.warn("Raw response:", text);
      
      // Fallback: Extract JSON if possible
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          return {
            type: extracted.type || "general",
            userInput: extracted.userInput || command,
            response: extracted.response || "I understand your request.",
            searchQuery: extracted.searchQuery || null,
            action: extracted.action || null,
            parameters: extracted.parameters || {}
          };
        }
      } catch (extractErr) {
        console.warn("Failed to extract JSON from response");
      }
      
      // Ultimate fallback
      return {
        type: "general",
        userInput: command,
        response: "I heard you say: " + command.substring(0, 100),
        searchQuery: null,
        action: null,
        parameters: {}
      };
    }
  } catch (error) {
    console.error("Gemini API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 429) {
      throw new Error("API quota exhausted. Please try again later.");
    }
    
    return null;
  }
};

export default geminiResponse;