async function test() {
    try {
        console.log("Fetching edge route...");
        const response = await fetch("https://studyflow-ai-tawny.vercel.app/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: "A beautiful scenery" })
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
