// ===================================
// IMAGE_AI.JS
// IA AMÉLIORATION IMAGE
// ===================================

const ImageAI = {

    async corriger(imageBase64){

        return new Promise((resolve)=>{

            afficherMessage(
                "Optimisation image..."
            );

            const image = new Image();

            image.onload = ()=>{

                const canvas =
                    document.createElement(
                        "canvas"
                    );

                const ctx =
                    canvas.getContext(
                        "2d"
                    );

                canvas.width =
                    image.width;

                canvas.height =
                    image.height;

                ctx.drawImage(

                    image,

                    0,

                    0

                );

                // amélioration contraste

                let donnees =

                    ctx.getImageData(

                        0,

                        0,

                        canvas.width,

                        canvas.height

                    );

                let pixels =
                    donnees.data;

                const contraste = 25;

                const facteur =

                    (259 *

                    (contraste + 255))

                    /

                    (255 *

                    (259 - contraste));

                for(

                    let i=0;

                    i<pixels.length;

                    i+=4

                ){

                    pixels[i] =

                        facteur *

                        (pixels[i]-128)

                        +128;

                    pixels[i+1] =

                        facteur *

                        (pixels[i+1]-128)

                        +128;

                    pixels[i+2] =

                        facteur *

                        (pixels[i+2]-128)

                        +128;

                }

                ctx.putImageData(

                    donnees,

                    0,

                    0

                );

                resolve(

                    canvas.toDataURL(

                        "image/jpeg",

                        0.95

                    )

                );

            };

            image.onerror = () => {

                console.error("Image invalide");

                resolve(null);

            };

            image.src =
                imageBase64;

        });

    }

};