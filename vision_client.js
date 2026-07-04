/**
 * ==========================================================
 * vision_client.js
 * ANOR V7 - PYTHON BRIDGE CLIENT
 * ==========================================================
 */

const axios = require("axios");
const fs = require("fs");


const VISION_URL = "http://127.0.0.1:8000/analyze";


async function analyserImage(pathImage) {

    const file = fs.createReadStream(pathImage);

    const res = await axios.post(VISION_URL, file, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return res.data;
}


module.exports = {
    analyserImage
};