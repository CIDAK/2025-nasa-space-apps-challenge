// fetchPodaacData.js
import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.EARTHDATA_TOKEN;
const COLLECTION_ID = "C2036877509-POCLOUD"; // AVHRRMTC_G-NAVO-L2P-v2.0 (MetOp-C)
const CMR_URL = "https://cmr.earthdata.nasa.gov/search/granules.json";

async function fetchPodaacData() {
  try {
    // Query the CMR API for available granules
    const response = await axios.get(CMR_URL, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: {
        collection_concept_id: COLLECTION_ID,
        page_size: 5, // limit for testing
      },
    });

    const granules = response.data.feed.entry;
    if (!granules?.length) {
      console.log("No granules found for this dataset.");
      return;
    }

    // Make sure data folder exists
    const dataDir = path.resolve("./data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    const filePath = path.join(dataDir, "podaac_granules.json");
    fs.writeFileSync(filePath, JSON.stringify(granules, null, 2));

    console.log(`Saved metadata: ${granules.length} granules to ${filePath}`);
  } catch (err) {
    console.error("Error PO.DAAC data:", err.message);
  }
}

fetchPodaacData();
