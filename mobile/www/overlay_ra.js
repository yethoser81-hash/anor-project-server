// ===================================
// OVERLAY_RA.JS
// SURCOUCHE VISUELLE
// ===================================

const OverlayRA = {

afficher(resultat){

const wrapper =

document.querySelector(

".vision-wrapper"

);

if(!wrapper){

return;

}


// évite les doublons

const ancien =

document.getElementById(

"overlay-anor"

);

if(ancien){

ancien.remove();

}


const overlay =

document.createElement(

"div"

);

overlay.id =

"overlay-anor";


overlay.style.position =

"absolute";

overlay.style.inset =

"0";

overlay.style.display =

"flex";

overlay.style.alignItems =

"center";

overlay.style.justifyContent =

"center";

overlay.style.background =

"rgba(0,135,81,0.15)";

overlay.style.fontSize =

"80px";

overlay.style.zIndex =

"20";

overlay.innerHTML =

"✓";


wrapper.appendChild(

overlay

);


setTimeout(()=>{

overlay.remove();

},500);

}

};