// ===================================
// SCEAU_AI.JS
// PRÉ-VALIDATION AVANT SERVEUR
// ===================================

const SceauAI = {

async verifier(imageBase64){

return new Promise((resolve)=>{

afficherMessage(

"Pré-analyse..."

);

const image = new Image();

image.onload=()=>{

const canvas=

document.createElement(

"canvas"

);

const ctx=

canvas.getContext(

"2d"

);

canvas.width=

image.width;

canvas.height=

image.height;

ctx.drawImage(

image,

0,

0

);

const imageData=

ctx.getImageData(

0,

0,

canvas.width,

canvas.height

);

const score=

this.evaluerQualite(

imageData

);


if(score){

resolve({

success:true

});

}

else{

resolve({

success:false,

message:

"Rapprochez le téléphone du sceau"

});

}

};

image.src=

imageBase64;

});

},



evaluerQualite(imageData){

const pixels=

imageData.data;

let total=0;

let nb=0;

for(

let i=0;

i<pixels.length;

i+=40

){

const lum=

(

pixels[i]

+

pixels[i+1]

+

pixels[i+2]

)

/

3;

total+=lum;

nb++;

}

const moyenne=

total/nb;

return(

moyenne>30

&&

moyenne<230

);

}

};