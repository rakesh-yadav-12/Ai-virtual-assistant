# 🧠 AI Virtual Assistant with Voice Control

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)
<img width="1910" height="971" alt="Screenshot 2025-12-22 135215" src="https://github.com/user-attachments/assets/9007ef43-04d6-40b1-9433-482d6c0d4f70" />
<img width="1884" height="960" alt="Screenshot 2025-12-22 135257" src="https://github.com/user-attachments/assets/ad2f2e93-7fa0-4aa8-a10c-5199db07d682" />
<img width="1874" height="955" alt="Screenshot 2025-12-22 135404" src="https://github.com/user-attachments/assets/d169e22f-96d0-4d7b-9b6a-f240465d1819" />
<img width="1878" height="912" alt="Screenshot 2025-12-22 135425" src="https://github.com/user-attachments/assets/f7c0d18a-09a2-4e4a-a306-7a719cf61ffb" />
<img width="1892" height="879" alt="Screenshot 2025-12-22 135456" src="https://github.com/user-attachments/assets/32ab88f3-800b-419c-ba66-9ffc1d9fd180" />
<img width="1119" height="906" alt="Screenshot 2025-12-22 135534" src="https://github.com/user-attachments/assets/baf7ed70-0f12-4b7d-b714-78681544fe3c" />
<img width="1858" height="772" alt="Screenshot 2025-12-22 135606" src="https://github.com/user-attachments/assets/323cf11a-60a5-404d-bd63-f159436c2f7e" />
<img width="1892" height="1071" alt="Screenshot 2025-12-22 135823" src="https://github.com/user-attachments/assets/3a06a48c-4dad-40fc-89d8-ae23aa37d008" />
<img width="1866" height="817" alt="Screenshot 2025-12-22 135859" src="https://github.com/user-attachments/assets/40c0d1ef-575b-4b27-8bf1-b44b7843e78e" />
<img width="1900" height="969" alt="Screenshot 2025-12-22 140037" src="https://github.com/user-attachments/assets/f66f4d9d-4f43-411d-925c-8d7395b488ab" />
<img width="1904" height="964" alt="Screenshot 2025-12-22 140103" src="https://github.com/user-attachments/assets/9f0e4cce-a28c-4045-b6e3-93eaa28950fa" />
<img width="1905" height="1068" alt="Screenshot 2025-12-22 140136" src="https://github.com/user-attachments/assets/f84cf7c3-05a6-4667-9c16-ad753f6d477c" />


A full-stack, voice-activated virtual assistant that processes natural language commands, automates web tasks, and features a customizable avatar interface. This project demonstrates integration of modern AI, real-time voice processing, and a complete user authentication system.

## 🎥 Demo

*   **Live Demo:** [Add your hosted application link here, e.g.,https://ai-virtual-assistant-13f.onrender.com]
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
    [Image 1: SignUp and Loging]`
    *Caption: Secure user login and registration pages with form validation.*
     <img width="1913" height="1074" alt="Screenshot 2025-12-22 190011" src="https://github.com/user-attachments/assets/5c05c8ab-e256-4cba-823c-dfe43a888ebd" />
    <img width="1909" height="1062" alt="Screenshot 2025-12-22 165335" src="https://github.com/user-attachments/assets/c7bc6366-1519-4a2a-973e-04ad7ea4d143" />
  

    `[Image 2: Avatar Selection Screen]`
    *Caption: Interactive grid for users to select or upload a custom assistant avatar.*
<img width="1892" height="1071" alt="Screenshot 2025-12-22 135823" src="https://github.com/user-attachments/assets/8f8b651f-55bd-481b-94a0-a8393b2c010a" />
<img width="1866" height="817" alt="Screenshot 2025-12-22 135859" src="https://github.com/user-attachments/assets/71075a82-a39c-495c-a56e-febf22444274" />
<img width="1900" height="969" alt="Screenshot 2025-12-22 140037" src="https://github.com/user-attachments/assets/e53bace2-e958-4f65-a3cf-f01a106d1546" />

    `[Image 3: Assistant Naming Screen]`
    *Caption: Final onboarding step to personalize the assistant's name.*
    <img width="1892" height="879" alt="Screenshot 2025-12-22 135456" src="https://github.com/user-attachments/assets/5369f6a0-4a2c-494f-a7d8-82c53666cb49" />
<img width="1119" height="906" alt="Screenshot 2025-12-22 135534" src="https://github.com/user-attachments/assets/94880210-be74-4f83-809f-b78a13c13871" />
<img width="1858" height="772" alt="Screenshot 2025-12-22 135606" src="https://github.com/user-attachments/assets/7c8beb1c-6265-41ea-8cb9-f95b1f2b3ce2" />


3.  **Core Assistant Interface**
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

