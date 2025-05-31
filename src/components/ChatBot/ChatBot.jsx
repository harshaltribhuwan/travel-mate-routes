import React, { useState, useEffect } from "react";
import "./ChatBot.scss";

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Mock responses with contextual logic
  const mockResponses = [
    {
      keywords: ["beach", "sea", "ocean", "gokarna", "coast", "sand", "waves"],
      response: `🗓️ **3-Day Gokarna Itinerary**  
**Day 1: Arrival & Beach Hopping**  
- **Morning**: Depart from Pune and arrive by afternoon.  
- **Afternoon**: Check in and head to Kudle Beach for lunch.  
- **Evening**: Sunset at Om Beach with a light trek to Half Moon Beach.  

**Day 2: Serenity & Spirituality**  
- **Morning**: Visit Mahabaleshwar Temple.  
- **Afternoon**: Boat or trek to Paradise Beach.  
- **Evening**: Catch peaceful vibes at Small Hell Beach.  

**Day 3: Nature & Departure**  
- **Morning**: Explore the surreal Yana Caves.  
- **Afternoon**: Visit Mirjan Fort before heading back.  

🌦️ **Weather (June 1–3)**: Cloudy with scattered showers. Pack light rainwear!

✨ **Tips**:  
- Carry a power bank & dry bags  
- Best travel mode: Overnight bus or car from Pune  
- Chill stays: Zostel Gokarna or Namaste Yoga Farm  
`,
    },
    {
      keywords: [
        "mountain",
        "hiking",
        "trek",
        "peaks",
        "trails",
        "nature",
        "everest",
        "leh",
        "ladakh",
      ],
      response: `🏞️ **Feeling the call of the mountains?**  
Here are 3 epic options:

1. **Ladakh (India)** 🏔️  
   - Pangong Lake, Nubra Valley, Khardung La  
   - Ideal for adventure bikers & nature lovers  

2. **Himachal Treks** ⛺  
   - Try Hampta Pass, Bhrigu Lake, or Triund  
   - Best time: May to October  

3. **The Alps (Europe)** ⛷️  
   - Explore Switzerland's Interlaken or Zermatt  
   - Try skiing, cable cars, or Alpine hiking routes  

🎒 Pack layers, stay hydrated & carry altitude meds if needed.  
Ready to scale new heights?`,
    },
    {
      keywords: [
        "city",
        "urban",
        "culture",
        "museums",
        "nightlife",
        "food",
        "shopping",
        "tokyo",
        "paris",
        "bangkok",
        "berlin",
      ],
      response: `🌆 **City Escapes for the Culture Buff in You**  

Here are a few you’ll love:

- **Tokyo** 🇯🇵  
  High-tech meets tradition. Try sushi bars, Harajuku fashion, and neon-lit nights.  

- **Paris** 🇫🇷  
  Art, romance & bakeries. Explore the Louvre, Montmartre, and cozy cafés.  

- **Bangkok** 🇹🇭  
  Food heaven! Night markets, temples, and rooftop bars await.  

- **Berlin** 🇩🇪  
  Graffiti tours, history, and underground techno — raw and artistic.  

🎟️ Want ideas for events, local guides, or must-try dishes? Just ask!`,
    },
    {
      keywords: [
        "offbeat",
        "hidden",
        "unique",
        "road trip",
        "slow travel",
        "unexplored",
        "remote",
      ],
      response: `🧭 **Offbeat Adventures** for the curious wanderer:  

- **Spiti Valley (India)** 🏔️  
  Stark, spiritual, and soul-stirring. Stay in a monastery homestay.  

- **Chiang Rai (Thailand)** ⛩️  
  White Temple, blue hues, and peaceful landscapes  

- **Faroe Islands** 🌊  
  Grass-roof houses, puffins, and dramatic cliffs  

- **Meghalaya (India)** 🌿  
  Live root bridges, caves, and cleanest villages  

🛣️ Perfect for road trippers and explorers. Want directions, stays, or packing tips?  
I got you!`,
    },
    {
      keywords: [
        "desert",
        "sand dunes",
        "camel",
        "jaisalmer",
        "sahara",
        "dry",
        "sunset",
        "rajput",
      ],
      response: `🏜️ **Desert Dreams Incoming!**  

Here are a few stunning options:

- **Jaisalmer, India**  
  Ride a camel into golden sand dunes and camp under the stars.  

- **Wadi Rum, Jordan**  
  Feel like you're on Mars — red rocks, Bedouin tents, and stargazing.  

- **Sahara Desert, Morocco**  
  Sandboarding, 4x4 dunes, and mint tea in the middle of nowhere.  

🎒 Essentials: Sunscreen, scarf, sunglasses, hydration packs.  
Need a guide? Let’s plan it.`,
    },
    {
      keywords: [],
      response:
        "Hey traveler! 🌍 Where do you feel like going next? Beach? City, Mountains? A hidden waterfall? Or maybe a buzzing cityscape? Let me guide you there!",
    },
  ];

  const getBotResponse = (userInput) => {
    const inputLower = userInput.toLowerCase();
    const matchedResponse =
      mockResponses.find((res) =>
        res.keywords.some((keyword) => inputLower.includes(keyword))
      ) || mockResponses[mockResponses.length - 1]; // Fallback to generic response
    return matchedResponse.response;
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setMessages([...messages, { text: input, sender: "user", timestamp }]);
      setInput("");
      setIsTyping(true);
      // Simulate bot response with a delay
      setTimeout(() => {
        const botResponse = getBotResponse(input);
        setMessages((prev) => [
          ...prev,
          { text: botResponse, sender: "bot", timestamp },
        ]);
        setIsTyping(false);
      }, 1200);
    }
  };

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages([
      {
        text: "Hi there! 👋 I’m your TravelMate Buddy. Ask me anything about your next trip!",
        sender: "bot",
        timestamp,
      },
    ]);
  }, []);


  // Auto-scroll to the latest message
  useEffect(() => {
    const chatMessages = document.querySelector(".chat-messages");
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>TravelMate Buddy</h2>
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            <div className="message-content">
              <div className="message-text">{msg.text}</div>
              <div className="message-timestamp">{msg.timestamp}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message bot">
            <div className="message-content typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>
      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your next adventure..."
          className="input-field"
          autoFocus
        />
        <button type="submit" className="send-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="24"
            height="24"
          >
            <path d="M2.01 21L23 12 2.01 3v7l15 2-15 2v7z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
