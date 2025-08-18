import{u as l}from"./useQuery-DTQ6mRtF.js";import{s as c}from"./index-WvZcqDcg.js";async function n(){const{data:a,error:e}=await c.from("matches").select(`
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
    `).order("scheduled_at",{ascending:!0});if(e)throw e;return a||[]}function d(){const{data:a=[],isLoading:e,error:r,dataUpdatedAt:t}=l({queryKey:["matches","polling"],queryFn:n,refetchInterval:1e4,refetchIntervalInBackground:!0,staleTime:0,gcTime:3e5});return{matches:a,isLoading:e,error:r?r instanceof Error?r.message:"Failed to fetch matches":null,lastUpdated:t?new Date(t):null}}export{d as u};
