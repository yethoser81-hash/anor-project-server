/**
 * ==========================================================
 * logoANOR.js
 * Logo vectoriel ANOR
 * ==========================================================
 */

const LogoANOR = {

render(cx=250,cy=250,r=68){

return `

<g id="logoANOR">

<!-- disque blanc -->

<circle
cx="${cx}"
cy="${cy}"
r="${r}"
fill="white"/>

<!-- anneau extérieur -->

<circle
cx="${cx}"
cy="${cy}"
r="${r-2}"
fill="none"
stroke="#0057B8"
stroke-width="3"/>

<!-- anneau intérieur -->

<circle
cx="${cx}"
cy="${cy}"
r="${r-10}"
fill="none"
stroke="#0057B8"
stroke-width="1.5"/>

<!-- NC -->

<text
x="${cx}"
y="${cy+8}"
font-size="42"
font-family="Arial"
font-weight="bold"
fill="#0057B8"
text-anchor="middle">

NC

</text>

<!-- étoile haute -->

<polygon
fill="#0057B8"
points="
${cx},${cy-r+14}
${cx+3},${cy-r+23}
${cx+13},${cy-r+23}
${cx+5},${cy-r+29}
${cx+8},${cy-r+39}
${cx},${cy-r+33}
${cx-8},${cy-r+39}
${cx-5},${cy-r+29}
${cx-13},${cy-r+23}
${cx-3},${cy-r+23}
"/>

</g>

`;

}

};

window.LogoANOR=LogoANOR;