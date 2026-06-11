async function test() {
    try {
        const response = await fetch("https://studyflow-ai-tawny.vercel.app/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: "A cute dog" })
        });
        console.log("Status:", response.status);
        if (response.ok) {
            const data = await response.json();
            console.log("Success! Image URL length:", data.url ? data.url.length : 0);
        } else {
            const err = await response.text();
            console.error("Error:", err);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
test();
