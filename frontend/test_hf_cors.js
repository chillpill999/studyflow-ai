async function test() {
    try {
        const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
            method: "OPTIONS",
            headers: {
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type"
            }
        });
        console.log("OPTIONS Status:", response.status);
        console.log("CORS Headers:", response.headers.get("access-control-allow-origin"));
    } catch (e) {
        console.error(e);
    }
}
test();
