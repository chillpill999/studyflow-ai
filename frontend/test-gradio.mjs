import { client } from "@gradio/client";
import fs from "fs";

async function run() {
  try {
    const app = await client("black-forest-labs/FLUX.1-schnell");
    const result = await app.predict("/infer", [
      "A cute dog", // string  in 'Prompt' Textbox component
      0, // number  in 'Seed' Slider component
      true, // boolean  in 'Randomize seed' Checkbox component
      1024, // number  in 'Width' Slider component
      1024, // number  in 'Height' Slider component
      1, // number  in 'Num inference steps' Slider component
    ]);

    console.log(result.data);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
