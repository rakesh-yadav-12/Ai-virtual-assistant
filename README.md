# 🧠 AI Virtual Assistant with Voice Control

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)

A full-stack, voice-activated virtual assistant that processes natural language commands, automates web tasks, and features a customizable avatar interface. This project demonstrates integration of modern AI, real-time voice processing, and a complete user authentication system.

## 🎥 Demo

*   **Live Demo:** [Add your hosted application link here, e.g., https://yourapp.vercel.app]
*   **Video Walkthrough:** [Link to a short screen recording/Loom video demonstrating key features]

## ✨ Features

*   **🎤 Real-Time Voice Commands**: Continuous listening with wake-word detection using the Web Speech API.
*   **🤖 AI-Powered Intent Recognition**: Processes commands using the Google Gemini API to classify intents (search, weather, open apps, etc.).
*   **🔄 Automated Task Execution**: Executes actions like web searches, opening social media, checking time/date, and launching calculators based on user intent.
*   **👤 User Personalization**: Full user auth (Signup/Login) with JWT. Customizable assistant name and avatar image (via Cloudinary upload).
*   **💬 Conversational UI**: Provides typed and spoken (Text-to-Speech) responses in a clean, modern interface.
*   **🔐 Secure Backend**: RESTful API built with Node.js & Express, featuring protected routes and secure password handling.

## 🖼️ Project Screenshots & Flow

Here is the visual journey through the application:

1.  **Authentication & Onboarding**
    `[Image 1: Login/Signup Interface]`
    *Caption: Secure user login and registration pages with form validation.*

    `[Image 2: Avatar Selection Screen]`
    *Caption: Interactive grid for users to select or upload a custom assistant avatar.*

    `[Image 3: Assistant Naming Screen]`
    *Caption: Final onboarding step to personalize the assistant's name.*

2.  **Core Assistant Interface**
    `[Image 4: Main Dashboard / Chat Interface]`
    *Caption: The main dashboard showing the personalized assistant avatar, voice control buttons, and conversation history.*

    `[Image 5: Voice Command in Action]`
    *Caption: A demonstration of a live voice command being processed and the assistant's textual and spoken response.*

    `[Image 6: Task Execution Demo]`
    *Caption: Example of the assistant automatically opening a new browser tab to perform a Google search or launch an application.*

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Axios, Web Speech API |
| **Backend** | Node.js, Express.js, JWT, Bcrypt.js, Cookie-parser |
| **Database** | MongoDB, Mongoose ODM |
| **External APIs** | Google Gemini AI, Cloudinary (Image Storage) |
| **DevOps & Tools** | Git, GitHub, dotenv, Nodemon, Multer |

**System Flow:**
<img width="953" height="115" alt="image" src="https://github.com/user-attachments/assets/98bc96a4-d530-466a-8124-db1794821793" />

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   MongoDB (Local instance or Atlas URI)
*   API Keys for [Google Gemini AI](https://makersuite.google.com/app/apikey) and [Cloudinary](https://cloudinary.com/)

### Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/rakesh-yadav-12/virtual-assistant.git
    cd virtual-assistant
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    # Create a .env file and add your keys (see .env.example)
    npm run dev
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    # Update the VITE_API_URL in .env if needed
    npm run dev
    ```

4.  **Access the Application**
    *   Backend API: `http://localhost:5000`
    *   Frontend App: `http://localhost:5173`

> **Note**: A detailed `.env.example` file is provided in each directory. Ensure you fill out all required environment variables.

## 📁 Project Structure
<img width="761" height="596" alt="image" src="https://github.com/user-attachments/assets/8c95b797-c669-4a34-8b5a-fc17a987f9ba" />

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author
**Rakesh Yadav**
- GitHub: [@rakesh-yadav-12](https://github.com/rakesh-yadav-12)
- Project Link: [https://github.com/rakesh-yadav-12/virtual-assistant](https://github.com/rakesh-yadav-12/virtual-assistant)

---
**⭐ If you found this project interesting or useful, please consider giving it a star on GitHub!**

