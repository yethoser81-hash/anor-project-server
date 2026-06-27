// ===================================
// CAMERA_AI.JS
// IA CAMÉRA
// ===================================

const CameraAI = {

    async capturer() {

        return new Promise(async (resolve, reject) => {

            try {

                const video =
                    document.getElementById("webcam-view");

                const stream =
                    await navigator.mediaDevices.getUserMedia({

                        video: {

                            facingMode: {

                                ideal: "environment"

                            },

                            width: 1280,

                            height: 720

                        }

                    });

                video.srcObject = stream;

                await video.play(); // 🔥 CRITIQUE ANDROID

                const placeholder =
                    document.getElementById(
                        "placeholder-ui"
                    );

                if(placeholder){

                    placeholder.style.display =
                    "none";

                }

                afficherMessage(
                    "Stabilisation..."
                );

                setTimeout(() => {

                    this.choisirMeilleureImage(
                        video,
                        stream
                    )

                    .then(resolve)

                    .catch(reject);

                }, 3000);

            }

            catch(error){

                reject(error);

            }

        });

    },



    async choisirMeilleureImage(
        video,
        stream
    ){

        return new Promise((resolve)=>{

            const canvas =
                document.createElement("canvas");

            const ctx =
                canvas.getContext("2d");

            // FIX ANDROID : Gestion du cas où videoWidth/Height sont 0
            canvas.width = video.videoWidth || 1280;

            canvas.height = video.videoHeight || 720;

            let meilleureImage = null;

            let meilleurScore = -1;

            let prises = 0;

            const total = 15;

            const interval = setInterval(()=>{

                ctx.drawImage(
                    video,
                    0,
                    0
                );

                const score =
                    this.evaluerQualite(
                        canvas
                    );

                if(score > meilleurScore){

                    meilleurScore = score;

                    meilleureImage =
                        canvas.toDataURL(
                            "image/png"
                        );

                }

                prises++;

                if(prises >= total){

                    clearInterval(
                        interval
                    );

                    stream.getTracks().forEach(track => {

                        track.stop();

                    });

                    resolve({

                        image: meilleureImage

                    });

                }

            },120);

        });

    },



    evaluerQualite(canvas){

        const ctx =
            canvas.getContext("2d");

        // FIX SAFE : Évite le crash getImageData sur canvas vide
        if (canvas.width === 0 || canvas.height === 0) {
            return 0;
        }

        const image =
            ctx.getImageData(

                0,

                0,

                canvas.width,

                canvas.height

            );

        let somme = 0;

        const pixels =
            image.data;

        for(

            let i=0;

            i<pixels.length;

            i+=4

        ){

            somme +=

            pixels[i]

            +

            pixels[i+1]

            +

            pixels[i+2];

        }

        const luminosite =

            somme

            /

            (

                pixels.length

                /

                4

            );

        // Plus on est proche de 380
        // plus c'est équilibré

        return 1000 -

            Math.abs(

                380 -

                luminosite

            );

    }

};