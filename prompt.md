Help me build a user-authenticated web application that uses the Gemini API and Firestore. 

**User Flow:**
1. The user arrives at the landing page and is prompted to Sign In.
2. After successful authentication, the user is taken to their private dashboard.
3. The dashboard allows the user to write multi-turn "journal entries" or "reflections" and converse with Gemini.
4. Gemini provides helpful summaries, brainstorming ideas, or reflections on the user's input.
5. All interactions (prompts and Gemini responses) are saved to the Firstore, isolated strictly to this specific user so that different users can't read each other's entries.
6. The user can view a history of their past entries.

**Tech Stack Requirements:**
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Secure login via Google Sign-In, do not directly store emails and passwords. |
| **Backend Database** | Cloud Firestore | User-isolated document storage for saving chat history and session summaries. |
| **AI Processing Engine** | Gemini 3.6 Flash API | Generates replies and provides summarization of user journal entries. |
| **Secret Management** | Secret Manager / Env Vars | Securely stores Gemini API keys and Firebase credentials. |
You will first see a threat model analysis that describes how AI Studio will handle common issues that may apply to your