function RNG(seed){
    this.s = seed>>>0;
}
RNG.prototype.next=function(){
    this.s=(1664525*this.s+1013904223)>>>0;
    return this.s/4294967296;
};
RNG.prototype.range=function(a,b){
    return a+(b-a)*this.next();
};
RNG.prototype.pick=function(a){
    return a[(this.next()*a.length)|0];
};

const COLORS = ["#336699","#2b5f8f","#3f79b8"];

function drawSeal(ctx,seed){
    const rng=new RNG(seed);
    const C=500;

    ctx.clearRect(0,0,1000,1000);
    ctx.fillStyle="#fff";
    ctx.fillRect(0,0,1000,1000);

    // background halo
    const g=ctx.createRadialGradient(C,C,80,C,C,420);
    g.addColorStop(0,"rgba(51,102,153,0.08)");
    g.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(C,C,420,0,Math.PI*2);
    ctx.fill();

    // guilloche simple
    ctx.strokeStyle="rgba(51,102,153,0.2)";
    ctx.lineWidth=1;
    ctx.beginPath();
    for(let a=0;a<Math.PI*2;a+=0.01){
        const r=360+Math.sin(a*12)*6+Math.cos(a*7)*4;
        const x=C+Math.cos(a)*r;
        const y=C+Math.sin(a)*r;
        if(a===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    }
    ctx.stroke();

    function ring(radius,count,size,mode){
        for(let i=0;i<count;i++){
            const a=(i/count)*Math.PI*2 + rng.range(-0.02,0.02);
            const x=C+Math.cos(a)*radius;
            const y=C+Math.sin(a)*radius;

            ctx.save();
            ctx.translate(x,y);
            ctx.rotate(a+rng.range(-0.2,0.2));

            ctx.strokeStyle=COLORS[(rng.next()*COLORS.length)|0];
            ctx.fillStyle=ctx.strokeStyle;
            ctx.lineWidth=1;

            if(mode===0){
                ctx.fillRect(-4,-size,8,size*2);
            }
            if(mode===1){
                ctx.beginPath();
                ctx.arc(0,0,size,0,Math.PI*2);
                ctx.fill();
            }
            if(mode===2){
                ctx.strokeRect(-size/2,-size/2,size,size);
            }
            if(mode===3){
                ctx.beginPath();
                ctx.moveTo(-size,0);
                ctx.lineTo(size,0);
                ctx.moveTo(0,-size);
                ctx.lineTo(0,size);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    // anneaux
    ring(420,64,10,0);
    ring(360,52,6,2);
    ring(300,72,4,1);
    ring(240,96,3,3);

    // micro points
    ctx.fillStyle="rgba(51,102,153,0.35)";
    for(let i=0;i<220;i++){
        const a=rng.next()*Math.PI*2;
        const r=260+rng.range(-5,5);
        ctx.beginPath();
        ctx.arc(C+Math.cos(a)*r,C+Math.sin(a)*r,1,0,Math.PI*2);
        ctx.fill();
    }

    // center core
    ctx.fillStyle="#336699";
    ctx.beginPath();
    ctx.arc(C,C,60,0,Math.PI*2);
    ctx.fill();

    ctx.strokeStyle="#fff";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(C,C,85,0,Math.PI*2);
    ctx.stroke();
}