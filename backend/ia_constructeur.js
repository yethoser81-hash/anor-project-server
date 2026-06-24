// ===================================
// API.JS
// COMPATIBLE SERVER.JS
// ===================================

function dataURLtoBlob(dataurl){

    const arr = dataurl.split(',');

    const mime =
    arr[0].match(/:(.*?);/)[1];

    const bstr =
    atob(arr[1]);

    let n =
    bstr.length;

    const u8arr =
    new Uint8Array(n);

    while(n--){

        u8arr[n] =
        bstr.charCodeAt(n);

    }

    return new Blob(
        [u8arr],
        { type:mime }
    );
}

const API = {

URL: "https://anor-api.onrender.com",


async verifier(imageBase64){

try{

const blob =
dataURLtoBlob(
    imageBase64
);


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


return await response.json();

}

catch(error){

console.log(error);

return{

success:false

};

}

}

};