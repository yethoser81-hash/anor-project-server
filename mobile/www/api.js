// ===================================
// API.JS
// COMPATIBLE SERVER.JS
// ===================================

const API = {

URL:

"https://anor-api.onrender.com",



async verifier(imageBase64){

try{

const blob=

await (

await fetch(

imageBase64

)

)

.blob();


const formData=

new FormData();


formData.append(

"sceau",

blob,

"sceau.png"

);


const response=

await fetch(

`${this.URL}/api/produit/verifier`,

{

method:"POST",

body:formData

}

);


const resultat=

await response.json();


return resultat;

}

catch(error){

console.log(error);


return{

success:false,

message:

"Connexion impossible"

};

}

}

};