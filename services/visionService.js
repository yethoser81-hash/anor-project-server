/**
 * ==========================================================
 * services/visionService.js
 * ANOR V12
 * Service Vision OpenCV
 * ==========================================================
 */

const fs = require("fs");
const path = require("path");
const util = require("util");
const { execFile } = require("child_process");
const cacheSignature = require("./cacheSignature");
const crypto = require("crypto");
const cache = require("./cacheScan");

const exec = util.promisify(execFile);

const PYTHON =
    process.env.PYTHON_BIN ||
    "python";

const DECODER =
    path.join(__dirname, "..", "vision_decoder.py");

async function decoder(imagePath) {

    console.log("===== VISION =====");
    console.log("typeof =", typeof imagePath);
    console.log("Buffer =", Buffer.isBuffer(imagePath));
    console.log(imagePath);

    if (!fs.existsSync(imagePath)) {
        throw new Error("Image introuvable : " + imagePath);
    }

    // Ajout du hash avant l'appel Python
    const imageBuffer = fs.readFileSync(imagePath);
    const hash = crypto
        .createHash("sha256")
        .update(imageBuffer)
        .digest("hex");
    
    const deja = cache.get(hash);
    if (deja)
        return deja;

    let stdout;

    try {

        console.log("Python =", PYTHON);
        console.log("Decoder =", DECODER);
        const resultat = await exec(
            PYTHON,
            [
                DECODER,
                imagePath
            ],
            {
                maxBuffer: 20 * 1024 * 1024
            }
        );

        stdout = resultat.stdout;

    }
    finally {

        try {
            fs.unlinkSync(imagePath);
        }
        catch (_) {}

    }

    let lecture;

    try {

        console.log("===== STDOUT =====");
        console.log(stdout.substring(0,500));
        console.log("==================");
        lecture = JSON.parse(stdout);

    }
    catch (e) {

        throw new Error(
            "vision_decoder.py a renvoyé un JSON invalide."
        );

    }

    if (!lecture) {
        throw new Error("Aucune réponse du moteur Vision.");
    }

    // Gestion du cache par index géométrique
    const index = lecture.index_geometrique.sha256;
    const dejaSignature = cacheSignature.get(index);
    
    if (dejaSignature) {
        return dejaSignature;
    }

    // Ajout de la mise en cache après le retour Python
    cache.set(
        hash,
        lecture
    );
    
    cacheSignature.set(index, lecture);

    return lecture;

}

module.exports = {

    decoder

};