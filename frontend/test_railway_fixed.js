async function test() {
    try {
        const response = await fetch("https://studyflow-ai-production.up.railway.app/api/image/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: "A cute dog" })
        });
        console.log("Status:", response.status);
        if (response.ok) {
            const blob = await response.blob();
            console.log("Success! Image size:", blob.size);
        } else {
            const err = await response.text();
            console.error("Error:", err);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
test();
