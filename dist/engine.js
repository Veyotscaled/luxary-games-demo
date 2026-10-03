'use strict';
(function(root){
  const shuffle=(items,rng=Math.random)=>{const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const total=hand=>hand.reduce((s,t)=>s+t.a+t.b,0);
  const deck=()=>{const result=[];for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)result.push({id:`${a}-${b}`,a,b});return result;};
  class Domino {
    constructor(mode='classic',count=2,rng=Math.random){
      if(!['classic','telephone'].includes(mode)||![2,3,4].includes(count))throw Error('Некоректна гра');
      const tiles=shuffle(deck(),rng);this.mode=mode;this.hands=Array.from({length:count},()=>tiles.splice(0,7));this.stock=tiles;this.chain=[];this.scores=Array(count).fill(0);this.turn=0;this.passes=0;this.finished=false;this.winners=[];this.reason='';this.last='';
      let best=-1;this.hands.forEach((hand,p)=>hand.forEach(t=>{const rank=t.a===t.b?100+t.a:t.a+t.b;if(rank>best){best=rank;this.turn=p;}}));
    }
    legal(player=this.turn){if(this.finished)return [];const left=this.chain[0]?.a,right=this.chain.at(-1)?.b;return this.hands[player].flatMap((t,index)=>{const sides=[];if(!this.chain.length)sides.push('right');else{if(t.a===left||t.b===left)sides.push('left');if(t.a===right||t.b===right)sides.push('right');}return sides.length?[{index,sides,tile:t}]:[];});}
    openSum(){if(!this.chain.length)return 0;const l=this.chain[0],r=this.chain.at(-1);if(this.chain.length===1)return l.a+l.b;return (l.a===l.b?l.a*2:l.a)+(r.a===r.b?r.b*2:r.b);}
    play(index,side='right'){
      if(this.finished)throw Error('Партія вже завершена');const move=this.legal().find(m=>m.index===index&&m.sides.includes(side));if(!move)throw Error('Ця кісточка не підходить до обраного кінця');
      const p=this.turn,t={...this.hands[p].splice(index,1)[0]};if(this.chain.length){if(side==='left'){if(t.b!==this.chain[0].a)[t.a,t.b]=[t.b,t.a];this.chain.unshift(t);}else{if(t.a!==this.chain.at(-1).b)[t.a,t.b]=[t.b,t.a];this.chain.push(t);}}else this.chain.push(t);
      this.passes=0;const sum=this.openSum(),points=this.mode==='telephone'&&sum>0&&sum%5===0?sum:0;this.scores[p]+=points;this.last=`${t.a}:${t.b}${points?` · +${points} очок`:''}`;
      if(!this.hands[p].length)this.finish(p,'Всі кісточки викладено');else this.turn=(p+1)%this.hands.length;return {player:p,tile:t,points};
    }
    draw(){if(this.finished||this.legal().length||!this.stock.length)throw Error('Зараз не можна взяти кісточку');const tile=this.stock.pop();this.hands[this.turn].push(tile);this.last='Кісточка з базару';return tile;}
    pass(){if(this.finished||this.legal().length||this.stock.length)throw Error('Зараз не можна пропустити хід');this.passes++;this.last='Пропуск ходу';if(this.passes>=this.hands.length){const sums=this.hands.map(total),best=Math.min(...sums);const candidates=sums.map((s,i)=>s===best?i:-1).filter(i=>i>=0);this.finish(candidates[0],'Риба: немає доступних ходів',candidates);}else this.turn=(this.turn+1)%this.hands.length;}
    finish(player,reason,candidates=[player]){
      this.finished=true;this.reason=reason;
      if(this.mode==='telephone'){const award=Math.round(this.hands.reduce((s,h,i)=>s+(i===player?0:total(h)),0)/5)*5;this.scores[player]+=award;const max=Math.max(...this.scores);this.winners=this.scores.map((s,i)=>s===max?i:-1).filter(i=>i>=0);}else this.winners=candidates;
    }
    botMove(){if(this.finished)return;const moves=this.legal();if(moves.length){const best=moves.map(m=>({...m,rank:m.tile.a+m.tile.b})).sort((a,b)=>b.rank-a.rank)[0];return this.play(best.index,best.sides.at(-1));}if(this.stock.length)return this.draw();return this.pass();}
  }
  function ticket(rng=Math.random){
    let positions;do{positions=Array.from({length:3},()=>shuffle([0,1,2,3,4,5,6,7,8],rng).slice(0,5).sort((a,b)=>a-b));}while(!Array.from({length:9},(_,c)=>positions.some(row=>row.includes(c))).every(Boolean));
    const board=Array.from({length:3},()=>Array(9).fill(null));for(let col=0;col<9;col++){const rows=[0,1,2].filter(r=>positions[r].includes(col)),min=col===0?1:col*10,max=col===8?90:col*10+9;const numbers=shuffle(Array.from({length:max-min+1},(_,i)=>min+i),rng).slice(0,rows.length).sort((a,b)=>a-b);rows.forEach((r,i)=>board[r][col]=numbers[i]);}return board;
  }
  class Lotto {
    constructor(count=4,rng=Math.random){if(![2,3,4].includes(count))throw Error('Некоректна кількість гравців');this.tickets=Array.from({length:count},()=>ticket(rng));this.bag=shuffle(Array.from({length:90},(_,i)=>i+1),rng);this.called=[];this.finished=false;this.winners=[];this.reason='Квиток закрито повністю';}
    draw(){if(this.finished||!this.bag.length)throw Error('Розіграш завершено');const n=this.bag.pop();this.called.push(n);this.winners=this.tickets.map((t,i)=>t.flat().filter(n=>n!==null).every(n=>this.called.includes(n))?i:-1).filter(i=>i>=0);if(this.winners.length)this.finished=true;return n;}
    matched(player){return this.tickets[player].flat().filter(n=>n!==null&&this.called.includes(n)).length;}
  }
  const api={Domino,Lotto,ticket,deck,shuffle,total};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GameEngine=api;
})(typeof window==='undefined'?globalThis:window);
