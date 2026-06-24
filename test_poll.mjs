import fetch from 'node-fetch';

async function test() {
    const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{role: 'user', content: 'output {"hello":"world"}'}],
            model: 'openai',
            jsonMode: true
        })
    });
    console.log(await res.text());
}
test();
