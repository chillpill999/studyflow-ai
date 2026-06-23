async function test() {
    try {
        console.log("Fetching final route...");
        const response = await fetch("https://studyflow-ai-tawny.vercel.app/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: "A beautiful scenery" })
        });
        console.log("Status:", response.status);
        if (response.ok) {
            const data = await response.json();
            console.log("Success! Image URL length:", data.url ? data.url.length : "no url");
        } else {
            const err = await response.text();
            console.error("Error:", err);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
test();
