import{u as _}from"./useQuery-DTQ6mRtF.js";import{s as l}from"./index-WvZcqDcg.js";async function u(e){const{data:r,error:a}=await l.from("matches").select(`
      id, 
      name, 
      red_alliance_id, 
      blue_alliance_id, 
      scheduled_at, 
      red_score, 
      blue_score, 
      red_coral_rp, 
      red_auto_rp, 
      red_barge_rp, 
      blue_coral_rp, 
      blue_auto_rp, 
      blue_barge_rp,
      round,
      match_number,
      red:alliances!matches_red_alliance_id_fkey(name), 
      blue:alliances!matches_blue_alliance_id_fkey(name)
    `).eq("id",e).single();if(a)throw a;return r}function t(e){return _({queryKey:["match",e],queryFn:()=>u(e),enabled:!!e})}export{t as u};
