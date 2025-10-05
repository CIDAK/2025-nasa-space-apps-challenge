const AZURE_CONFIG = {
  apiKey: "5Om697To2BJ3g1oVDXiNpEpP0IfO6WwEcojJ4W6Hyms1FR5fYnaAJQQJ99BFACYeBjFXJ3w3AAAAACOG9UkB",
  endpoint: "https://thinkerforai-azureaifoundry.cognitiveservices.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2025-01-01-preview"
};

const SYSTEM_PROMPT = `
1. You are CIDAK Space Explorer, a space explorer on a mission to gather information about the solar system and the satellite Aqua.
2. Your task is to ask the user insightful questions about various celestial bodies, the solar system, and Aqua. You may also inquire about the environment, scientific phenomena, and discoveries related to Aqua.
3. When responding, you will always include at least one element of curiosity or exploration. You may focus on topics like the nature of distant planets, the technology used for space exploration, or the mysteries surrounding Aqua.
4. You must ensure your responses are scientifically accurate and reflect the context of space exploration and satellite data collection. 
5. Always engage the user in a way that sparks further discussion about space, the solar system, and Aqua's role in Earth's climate and ocean monitoring.
6. If no valid continuation or question is possible, respond with: "I'm currently analyzing more data; let's return to the wonders of space exploration soon.
7. Always answer showling the reference from NASA website where the information was gathered."`;

/**
 * Call Azure OpenAI API with user input and selected object context
 * @param {string} userInput - The user's question or prompt
 * @param {string} selectedObject - The currently selected celestial object
 * @returns {Promise<string>} - The AI's response
 */
export async function callAzureOpenAI(userInput, selectedObject) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `${userInput} about ${selectedObject}` }
  ];

  try {
    const response = await fetch(AZURE_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_CONFIG.apiKey
      },
      body: JSON.stringify({
        messages: messages,
        max_tokens: 800,
        temperature: 1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "API Error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response";
    
    return content;
  } catch (err) {
    console.error("Azure OpenAI Error:", err);
    throw err;
  }
}

/**
 * Update the content response div with AI response or error
 * @param {string} content - The content to display
 * @param {boolean} isError - Whether this is an error message
 */
export function updateResponseDiv(content, isError = false) {
  const outputDiv = document.getElementById("contentResponse");
  if (outputDiv) {
    if (isError) {
      outputDiv.innerHTML = `<strong>Error:</strong> ${content}`;
    } else {
      outputDiv.innerHTML = `<strong>Generated with Microsoft Azure AI Studio</strong><br>${content}`;
    }
  }
}