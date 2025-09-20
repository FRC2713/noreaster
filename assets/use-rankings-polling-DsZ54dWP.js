import{s as r}from"./index-DiB4IOcY.js";import{u as n}from"./use-smart-polling-Dq1UeSm6.js";async function o(){const{data:l,error:s}=await r.from("rankings").select(`
      id,
      alliance_id,
      rank,
      played,
      wins,
      losses,
      ties,
      avg_rp,
      avg_score,
      avg_auto_score,
      total_rp,
      total_score,
      total_auto_score,
      last_updated,
      created_at,
      alliances!rankings_alliance_id_fkey(name, emblem_image_url)
    `).order("rank",{ascending:!0});if(s)throw s;return(l||[]).map(a=>({...a,alliance_name:a.alliances?.name||"Unknown Alliance",emblem_image_url:a.alliances?.emblem_image_url||null}))}function _(){const{data:l=[],isLoading:s,error:a,dataUpdatedAt:t}=n({queryKey:["rankings","polling"],queryFn:o,refetchInterval:2e4,staleTime:15e3,gcTime:6e5});return{rankings:l.map(e=>({id:e.alliance_id,name:e.alliance_name,emblem_image_url:e.emblem_image_url,played:e.played,wins:e.wins,losses:e.losses,ties:e.ties,avgRp:e.avg_rp,avgScore:e.avg_score,avgAutoScore:e.avg_auto_score,rank:e.rank})),hydratedRankings:l,isLoading:s,error:a?a instanceof Error?a.message:"Failed to fetch rankings":null,lastUpdated:t?new Date(t):null}}export{_ as u};
