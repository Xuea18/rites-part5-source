// B: only the three foreground subject bells are interactive. All other bells remain scenery.
const groups=[
 ['5',[0],[1]],['6',[0],[1]],['7',[0],[1]]
];
const notes=['C4','D4','E4','G4','A4'];
export const bells=groups.flatMap(([group,xs,widths])=>xs.map((x,i)=>({
 id:`bell-${group}-${i+1}`,selector:`.rites_part5_chimegroup${group} img`,
 crop:[x,0,widths[i],1],note:notes[(Number(group[0])+i)%5],
 label:`${['5','6','7'].includes(group)?'主钟':group==='8'?'前景钟':'背景钟'} ${group}-${i+1}`,
 // No per-artifact facts are invented: reuse the baseline's existing explanation verbatim.
 description:'“乐悬”，指将编钟、石磬等大型乐器悬挂在特制架子上的一套陈列规制。'
})));
