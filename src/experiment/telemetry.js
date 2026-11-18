// B: local-only session storage. No network transmission or participant identifiers.
export function createTelemetry(totalQuotes){
 const key='exp_b_events';let records;try{records=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(records))records=[];}catch{records=[];}
 const session={id:crypto.randomUUID(),group:'B',startedAt:new Date().toISOString(),endedAt:null,events:[],quotesSeen:[],totalQuotes,visibleDurationMs:0};records.push(session);
 let last=performance.now(),wasVisible=!document.hidden;
 const save=()=>{const now=performance.now();if(wasVisible)session.visibleDurationMs+=now-last;last=now;wasVisible=!document.hidden;session.durationMs=Date.now()-Date.parse(session.startedAt);session.quoteCompletion=session.quotesSeen.length/session.totalQuotes;try{localStorage.setItem(key,JSON.stringify(records));}catch{session.storageUnavailable=true;}};
 const record=(type,target,extra)=>{session.events.push({timestamp:new Date().toISOString(),type,target,extra});save();};
 const quote=index=>{if(!session.quotesSeen.includes(index)){session.quotesSeen.push(index);record('quote',`quote-${index}`,{index});}};
 const finish=()=>{session.endedAt=new Date().toISOString();save();};
 const visibility=()=>save();
 addEventListener('pagehide',finish);document.addEventListener('visibilitychange',visibility);const timer=setInterval(save,5000);
 const exportAll=()=>{save();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(records,null,2)],{type:'application/json'}));a.download='exp_b_events.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
 if(new URLSearchParams(location.search).has('export'))setTimeout(exportAll,300);
 return {record,quote,exportAll,session,dispose(){finish();clearInterval(timer);removeEventListener('pagehide',finish);document.removeEventListener('visibilitychange',visibility);}};
}
