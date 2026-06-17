# A-Level Quiz Forge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Read this in other languages: 
[![English](https://img.shields.io/badge/English-blue)](README.md) [![中文](https://img.shields.io/badge/中文-blue)](README.zh.md)

**A smart, interactive web tool for A-Level students to analyse wrong answers and generate custom mock practice papers.**

Built with vanilla JavaScript, HTML5, and CSS3 — no frameworks, no backend, ready to run locally.

🔗 **Live Demo & More**: [http://exhelper.cc/](http://exhelper.cc/)

---

## ✨ Features

### Wrong‑Question Analysis (Demo)
- Enter the question, student’s answer, correct answer, and optional self‑judged reason.
- The tool performs a simple rule‑based analysis and returns:
  - Error type (e.g. calculation accuracy, concept misunderstanding)
  - Related knowledge points
  - Improvement suggestions
  - Next practice direction

### Mock Paper Generator
- Based on the selected grade, exam board, subject and paper, you can configure:
  - Number of questions (5–30)
  - Difficulty (Basic / Medium / Challenge / Mixed)
  - Question type (Multiple Choice / Structured / Mixed)
  - Duration target (30–120 minutes)
  - Knowledge points (multi‑select)
- A local question bank (in `examData.js`) is used to pick questions matching your configuration.
- The generated paper and answer key are displayed immediately.

### Demo‑ready
- All data is mocked; AI generation can be plugged in later by replacing the simple analysis rules and the question bank with real API calls.

---

## 🚀 How to Use

1. Clone or download the repository.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
3. Select your learning context:
   - Grade (G1, G2, AS, A2)
   - Exam board (CIE, Edexcel, AQA)
   - Subject (Mathematics, Physics, Chemistry)
   - Paper (depends on board/subject)
4. Choose a function:
   - **Wrong‑Question Analysis** – fill the form and get a demo analysis card.
   - **Generate Mock Practice** – configure parameters and view generated questions & answers.
5. All selections are saved in `localStorage` so your choices persist across pages.

---

## 📁 Project Structure
├── index.html # Home page – grade/board/subject/paper selection
├── analysis.html # Wrong‑question analysis form & result
├── mock-config.html # Mock paper configuration form
├── mock-result.html # Generated mock paper & answer key
├── app.js # Main application logic (all pages)
├── examData.js # Static data: grades, boards, knowledge points, question bank
├── styles.css # Global styles
└── README.md # This file

text

---

## 🛠️ Technology Stack

- **HTML5** – semantic structure
- **CSS3** – custom properties, responsive grid/flex, modern card design
- **Vanilla JavaScript (ES5+)** – no frameworks, lightweight and fast
- **LocalStorage** – persist user selections across pages
- **URLSearchParams** – pass configuration between pages via query strings

---

## 🔮 Future Extensions

- Replace rule‑based analysis with AI‑powered analysis (e.g. GPT API) for deeper feedback.
- Connect to a real question bank (database or external API).
- Add user accounts to save analysis history and mock papers.
- Support more subjects and exam boards.
- Provide detailed performance statistics and progress tracking.

---

## 📄 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

---

**Made with ❤️ for A-Level students and teachers.**  
Feel free to contribute, report issues, or suggest improvements.

🌐 Visit our website: [http://exhelper.cc/](http://exhelper.cc/)
