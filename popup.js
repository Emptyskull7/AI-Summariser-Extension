
document.getElementById("summarize").addEventListener("click", async () => {
  const resultDiv = document.getElementById("result");
  const summaryType = document.getElementById("summary-type").value;
  
  resultDiv.textContent = "";
  resultDiv.innerHTML = '<div class="loader"></div>';

  //get the user's API key
  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      resultDiv.textContent = "No API key set. Click the gear icon to add one.";
    }
    //Ask content.js for the page text
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_ARTICLE_TEXT" },
        async ({ text }) => {
          if (!text) {
            resultDiv.textContent = "Couldn't extract from this page.";
            return;
          }
          //Send text top Gemini
          try {
            const summary = await getGeminiSummary(
              text,
              summaryType,
              geminiApiKey
            );
            resultDiv.textContent = summary;
          } catch (err) {
            resultDiv.textContent = "Gemini Error " + err.message;
          }
        }
      );
    });
  });
});

async function getGeminiSummary(rawText, type, apiKey) {
  const max = 20000;
  const text = rawText.length > max ? rawText.slice(0, max) + "..." : rawText;

  const promptMap = {
    brief: `Summarize in 2-3 sentences:\n\n${text}`,
    detailed: `Give me a detailed summary:\n\n${text}`,
    bullets: `Summarize in 5-7 bullet points (start each line with "- "):\n\n${text}`,
  };

  const prompt = promptMap[type] || promptMap.brief;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
        method : "POST",
        headers : {"Content-type" : "application/json"},
        body : JSON.stringify({
            contents : [{ parts : [{ text : prompt }]}],
            generationConfig: { temperature : 0.2}
        }),
    }
  );
  if(!response.ok){
    const {error} = await response.json();
    throw new Error( error?.message || "Request failed.")
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No summary."
}
