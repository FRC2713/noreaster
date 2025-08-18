import{u}from"./useQuery-Cgu6KS9_.js";import{r as n,s as d}from"./index-BmdevC1f.js";import{u as _}from"./matches-store-DsfI4gDF.js";async function h(){const{data:r,error:a}=await d.from("matches").select(`
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
    `).order("scheduled_at",{ascending:!0});if(a)throw a;return r||[]}function p(){const{setMatches:r,setLoading:a,setError:c,setLastUpdated:l}=_(),{data:t=[],isLoading:o,error:e,dataUpdatedAt:s}=u({queryKey:["matches","polling"],queryFn:h,refetchInterval:1e4,refetchIntervalInBackground:!0,staleTime:0,gcTime:300*1e3});return n.useEffect(()=>{t.length>0&&(r(t),l(new Date(s)),console.log(`[Matches Store] Updated with ${t.length} matches at ${new Date().toLocaleTimeString()}`))},[t,s,r,l]),n.useEffect(()=>{a(o)},[o,a]),n.useEffect(()=>{if(e){const i=e instanceof Error?e.message:"Failed to fetch matches";c(i),console.error("[Matches Store] Error fetching matches:",e)}else c(null)},[e,c]),{matches:t,isLoading:o,error:e?e instanceof Error?e.message:"Failed to fetch matches":null,lastUpdated:s?new Date(s):null}}export{p as u};
