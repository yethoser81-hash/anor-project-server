function comparerSignature(scan, reference){

    let score=0;

    let total=reference.length;

    for(let i=0;i<total;i++){

        const a=scan[i];
        const b=reference[i];

        if(!a || !b)
            continue;

        if(a.forme===b.forme)
            score+=60;

        if(a.plein===b.plein)
            score+=20;

        if(a.position===b.position)
            score+=20;

    }

    return Number((score/(total*100)*100).toFixed(2));

}

module.exports={
    comparerSignature
};