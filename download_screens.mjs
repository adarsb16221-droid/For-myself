import { stitch } from "@google/stitch-sdk";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const projectId = "17101142305923496740";

const screensList = [
    { name: "Orbit_Dashboard", id: "47d23207b7a541449cb32630092e6619" },
    { name: "Journal_Plan", id: "14d2d52d78a048a1864f5c5ffa616d2d" },
    { name: "Quick_Links", id: "b04c72075b844750b5c107de23843154" },
    { name: "Schedule", id: "97539f95bda747a58a416bda2fdac7c3" },
    { name: "Journal_Plan_Mobile", id: "380e5f17ec294b82b4932ffa5c6a9dcc" },
    { name: "Quick_Links_Mobile", id: "2edd86e488b14f1cb033373f49d3644a" },
    { name: "Schedule_Mobile", id: "230fcff04f9c4b06a9fda70b206e89d4" },
    { name: "Orbit_Dashboard_Desktop", id: "aace4ea552bd407fbbcbc04e999f424c" },
    { name: "Orbit_Dashboard_Light_Desktop", id: "56bb442f76254f0290e642377194cf18" },
    { name: "Journal_Plan_Light_Mobile", id: "6c9f0c6ad17b444785112dbd706e5e3c" },
    { name: "Journal_Plan_Light_Desktop", id: "c1ece467c311499da6eec68752a0f9af" },
    { name: "Orbit_Dashboard_Light_Mobile", id: "dd43095735864b69b35220a7dc11a1cf" },
    { name: "Quick_Links_Light_Desktop", id: "8aa52b2a0f4a48988dc409dc0e0d1915" },
    { name: "Quick_Links_Light_Mobile", id: "3fcdf590a5fb47b19728bb50d1117dd2" },
    { name: "Schedule_Light_Desktop", id: "e70167fa6bc34bf8b5ff04f6dceb7ba3" },
    { name: "Schedule_Light_Mobile", id: "eb01e1e0b177403da14e93a583df73c4" }
];

async function downloadFile(url, dest) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    await fs.writeFile(dest, Buffer.from(buffer));
}

async function main() {
    const project = await stitch.project(projectId);
    
    // Check if there is a method to get a specific screen or if we should fetch all project screens
    let allScreens = [];
    try {
        allScreens = await project.screens();
    } catch (err) {
        console.error("Error fetching screens for project:", err.message);
        return;
    }

    const outDir = path.join(process.cwd(), "screens");
    await fs.mkdir(outDir, { recursive: true });

    for (const item of screensList) {
        try {
            console.log(`Downloading ${item.name}...`);
            // Find the screen from the fetched list
            const screen = allScreens.find(s => s.id === item.id || s.screenId === item.id);
            if (!screen) {
                console.warn(`Screen ${item.name} (${item.id}) not found in project.`);
                continue;
            }

            const htmlUrl = await screen.getHtml();
            const imageUrl = await screen.getImage();

            await downloadFile(htmlUrl, path.join(outDir, `${item.name}.html`));
            await downloadFile(imageUrl, path.join(outDir, `${item.name}.png`));
            console.log(`Successfully downloaded ${item.name}`);
        } catch (err) {
            console.error(`Failed on ${item.name}:`, err.message);
        }
    }
}

main().catch(console.error);
