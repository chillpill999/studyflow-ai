async function test() {
    try {
        const response = await fetch("https://hercai.onrender.com/v3/text2image?prompt=cute+dog");
        console.log("Status:", response.status);
        const data = await response.json();
        console.log(data);
    } catch (e) {
        console.log(e);
    }
}
test();
