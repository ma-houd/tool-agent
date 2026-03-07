"use client";
import { useState } from "react";

export default function Home() {
  const [response, setResponse] = useState<any>(null);
  const [question, setQuestion] = useState("");

  const handleAsk = () => {
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    })
      .then(res => res.json())
      .then(data => setResponse(data));
  };

  return (
    <>
      <div className="flex">
        <input type="text" placeholder="Ask a question" onChange={(e) => setQuestion(e.target.value)} />
        <button onClick={handleAsk}>Ask</button>
      </div>
      {response && (
        <div className="response">
          <h2>Response:</h2>
          {response.type === "calculator" && <p>Calculator Result: {response.result}</p>}
          {response.type === "datetime" && <p>Current DateTime: {response.datetime}</p>}
          {response.type === "fakeDB" && (
            <>
              <p>Name: {response.name}</p>
              <p>Age: {response.age !== null ? response.age : "Not found"}</p>
              <p>City: {response.city !== null ? response.city : "Not found"}</p>
            </>
          )}
          {response.type === 'text' && <p>{response.answer}</p>}
        </div>
      )}
    </>
  );
}
