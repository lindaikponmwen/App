const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/SessionList-9P-T7NnA.js","assets/vendor-react-CUD8yx-t.js","assets/x-Cy2WLszp.js","assets/vendor-supabase-BnHMz0Qv.js","assets/AnalysisWorkspace-DubNutQ8.js","assets/vendor-katex-8IUOXXTR.js","assets/vendor-monaco-hMAPXSrG.js"])))=>i.map(i=>d[i]);
import{r as d,a as v}from"./vendor-react-CUD8yx-t.js";import{c as b,_ as h}from"./vendor-supabase-BnHMz0Qv.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function i(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(a){if(a.ep)return;a.ep=!0;const r=i(a);fetch(a.href,r)}})();var N={exports:{}},E={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var w=d,F=Symbol.for("react.element"),U=Symbol.for("react.fragment"),k=Object.prototype.hasOwnProperty,M=w.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,Y={key:!0,ref:!0,__self:!0,__source:!0};function A(t,e,i){var s,a={},r=null,o=null;i!==void 0&&(r=""+i),e.key!==void 0&&(r=""+e.key),e.ref!==void 0&&(o=e.ref);for(s in e)k.call(e,s)&&!Y.hasOwnProperty(s)&&(a[s]=e[s]);if(t&&t.defaultProps)for(s in e=t.defaultProps,e)a[s]===void 0&&(a[s]=e[s]);return{$$typeof:F,type:t,key:r,ref:o,props:a,_owner:M.current}}E.Fragment=U;E.jsx=A;E.jsxs=A;N.exports=E;var m=N.exports,L,C=v;L=C.createRoot,C.hydrateRoot;const P="pmx_supabase_credentials";function g(){try{const t=localStorage.getItem(P);if(t){const e=JSON.parse(t);if(e.url&&e.anonKey)return{url:e.url,anonKey:e.anonKey}}}catch{}return{url:"https://sqquouoaauabvkqhojni.supabase.co",anonKey:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcXVvdW9hYXVhYnZrcWhvam5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMDI2NTUsImV4cCI6MjA5NjY3ODY1NX0.gbfUxbaGX5OxnwyCECJLN4mn_by6tK1zEsYufYwoH04"}}const{url:x,anonKey:X}=g(),n=b(x,X);function te(){try{const t=localStorage.getItem(P);if(!t)return!1;const e=JSON.parse(t);return!!(e.url&&e.anonKey)}catch{return!1}}function se(){return g().url}async function ie(t,e){const i=t.replace(/\/$/,"");try{const s=await fetch(`${i}/rest/v1/sessions?limit=0`,{headers:{apikey:e,Authorization:`Bearer ${e}`,Accept:"application/json"}});if(s.status===200)return{valid:!0,tablesExist:!0};if(s.status===404||s.status===400){const a=await s.json().catch(()=>({}));return a.code==="42P01"?{valid:!0,tablesExist:!1}:{valid:!1,error:`HTTP ${s.status}: ${JSON.stringify(a)}`}}return s.status===401?{valid:!1,error:"Invalid API key — check your anon key."}:s.status===0||!s.ok?{valid:!1,error:`Connection failed (HTTP ${s.status})`}:{valid:!1,error:`Unexpected status ${s.status}`}}catch(s){const a=String(s);return a.includes("fetch")?{valid:!1,error:"Could not reach the URL. Check it is correct and CORS is enabled."}:{valid:!1,error:a}}}function ae(t){const e=t.match(/https?:\/\/([^.]+)\.supabase\.co/);return e?e[1]:null}async function re(t,e){const i=G.split(/;\s*\n/).map(s=>s.trim().replace(/^--[^\n]*\n?/gm,"").trim()).filter(s=>s.length>2);for(const s of i){const a=s.endsWith(";")?s:`${s};`;try{const r=await fetch(`https://api.supabase.com/v1/projects/${t}/database/query`,{method:"POST",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json"},body:JSON.stringify({query:a})});if(!r.ok){const o=await r.json().catch(()=>({})),p=o.message||o.error||`HTTP ${r.status}`;if(!p.toLowerCase().includes("already exists"))return{success:!1,error:p}}}catch(r){return{success:!1,error:String(r)}}}return{success:!0}}const G=`-- PMx Pharmacometrics Schema Migration
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  compound TEXT,
  software_stack TEXT,
  analysis_type TEXT,
  data_status TEXT DEFAULT 'unknown',
  hitl_enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_sessions" ON sessions;
CREATE POLICY "select_sessions" ON sessions FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "insert_sessions" ON sessions;
CREATE POLICY "insert_sessions" ON sessions FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "update_sessions" ON sessions;
CREATE POLICY "update_sessions" ON sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_sessions" ON sessions;
CREATE POLICY "delete_sessions" ON sessions FOR DELETE TO anon USING (true);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  agent TEXT,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_messages" ON messages;
CREATE POLICY "select_messages" ON messages FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "insert_messages" ON messages;
CREATE POLICY "insert_messages" ON messages FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "update_messages" ON messages;
CREATE POLICY "update_messages" ON messages FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_messages" ON messages;
CREATE POLICY "delete_messages" ON messages FOR DELETE TO anon USING (true);

-- Checklist items
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  section_number TEXT,
  section_title TEXT,
  item_ref TEXT,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  item_type TEXT DEFAULT 'task',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_checklist" ON checklist_items;
CREATE POLICY "select_checklist" ON checklist_items FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "insert_checklist" ON checklist_items;
CREATE POLICY "insert_checklist" ON checklist_items FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "update_checklist" ON checklist_items;
CREATE POLICY "update_checklist" ON checklist_items FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_checklist" ON checklist_items;
CREATE POLICY "delete_checklist" ON checklist_items FOR DELETE TO anon USING (true);

-- Invocations
CREATE TABLE IF NOT EXISTS invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  envelope_id UUID DEFAULT gen_random_uuid(),
  agent_role TEXT NOT NULL,
  checklist_ref TEXT,
  status TEXT DEFAULT 'pending',
  request_payload JSONB,
  response_payload JSONB,
  task_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE invocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_invocations" ON invocations;
CREATE POLICY "select_invocations" ON invocations FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "insert_invocations" ON invocations;
CREATE POLICY "insert_invocations" ON invocations FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "update_invocations" ON invocations;
CREATE POLICY "update_invocations" ON invocations FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_invocations" ON invocations;
CREATE POLICY "delete_invocations" ON invocations FOR DELETE TO anon USING (true);

-- Artifacts (virtual file system)
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_artifacts" ON artifacts;
CREATE POLICY "select_artifacts" ON artifacts FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "insert_artifacts" ON artifacts;
CREATE POLICY "insert_artifacts" ON artifacts FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "update_artifacts" ON artifacts;
CREATE POLICY "update_artifacts" ON artifacts FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_artifacts" ON artifacts;
CREATE POLICY "delete_artifacts" ON artifacts FOR DELETE TO anon USING (true);
`,ne="https://openrouter.ai/api/v1/chat/completions",oe="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",ce="https://claude.ai",le="PharmaCo MultiAgent",de="a1b2c3d4-0001-0001-0001-000000000001",pe=[{id:"google/gemma-4-31b-it:free",label:"Gemma",provider:"Google AI"},{id:"moonshotai/kimi-k2.6:free",label:"Kimi K2.6",provider:"Moonshot AI"},{id:"deepseek/deepseek-v4-flash:free",label:"DeepSeek V4 Flash",provider:"DeepSeek"},{id:"nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",label:"Nemotron Nano 30B",provider:"NVIDIA"},{id:"qwen/qwen3-next-80b-a3b-instruct:free",label:"Qwen3 80B",provider:"Qwen"},{id:"openai/gpt-oss-120b:free",label:"GPT-OSS 120B",provider:"OpenAI"},{id:"nousresearch/hermes-3-llama-3.1-405b:free",label:"Hermes 3 405B",provider:"NousResearch"}],ue=2048,fe=3e3,me=10,Ee=3,Te=300,Oe=25,_e={scientist_ii:"Scientist II",project_manager:"Project Manager",pharmacometrician:"Pharmacometrician",data_manager:"Data Manager",medical_writer:"Medical Writer",qc_manager:"QC Manager"},Ie={scientist_ii:"bg-green-700",project_manager:"bg-blue-700",pharmacometrician:"bg-emerald-700",data_manager:"bg-violet-700",medical_writer:"bg-amber-700",qc_manager:"bg-rose-700"},Se={scientist_ii:"SII",project_manager:"PM",pharmacometrician:"PMx",data_manager:"DM",medical_writer:"MW",qc_manager:"QC"},Ce=320,Re=240,he=640,Ne=["Data","Scripts/Models","Scripts/R","Scripts/NONMEM","Results/Tables","Results/Estimates","Plots/GOF","Plots/VPC","Plots/Covariates","Reports","Config"];function Ae(t){const e=t.toLowerCase();return[".md",".docx",".doc",".txt"].includes(e)?"Reports":[".csv",".tab",".xls",".xlsx"].includes(e)?"Data":[".r"].includes(e)?"Scripts/R":[".ctl",".mod",".lst"].includes(e)?"Scripts/NONMEM":[".py",".cpp",".jl",".m"].includes(e)?"Scripts/Models":[".json",".yaml",".yml"].includes(e)?"Config":"Reports"}const V=new Set([".csv",".tab",".xls",".xlsx",".xpt",".sas7bdat"]);function B(t){const e=t.lastIndexOf(".");return e>=0?t.slice(e).toLowerCase():""}function Le(t){const e=t.replace(/^\//,"").split("/").filter(Boolean);if(e.length===0)return t;const i=e[e.length-1],s=B(i),a=e[0];return V.has(s)?a!=="Data"?`Data/${i}`:t:a==="Data"?`Reports/${e.slice(1).join("/")}`:t}const Pe=["Run a population PK analysis for compound XYZ-001 using NONMEM and nlmixr2","Explain how to set up a 2-compartment PopPK model in NONMEM","What covariate screening approach should I use for this dataset?","Help me interpret CWRES vs TIME plots showing a trend","Describe the VPC simulation approach for a 1-compartment model","What are typical %RSE thresholds for PK parameter acceptance?"],ge=["pk","pd","pkpd","pharmacokinetic","pharmacodynamic","pharmacometrics","nonmem","nlmixr","monolix","rxode","mrgsolve","clearance","volume","bioavailability","half-life","auc","cmax","compartment","model","simulation","population","covariate","absorption","distribution","metabolism","elimination","iiv","eta","omega","sigma","theta","ofv","aic","bic","vpc","gof","cwres","ipred","pred","residual","nca","eda","dataset","data","cdisc","sdtm","adam","report","presentation","qc","validation","drug","compound","dose","concentration","clinical","trial","pbpk","qsp","systems pharmacology","checklist","analysis","project","initialize"],H=[{number:"1",title:"Project Initialization & Software Specification",tasks:[{ref:"1.1",description:"Set up Session folder structure. Begin initial data analysis plan document Reports/analysis_plan.md"},{ref:"1.2",description:"Specify software stack (R, NONMEM 7.5, nlmixr2, rxode2) in analysis plan"},{ref:"1.3",description:"Define analysis objectives and scope in analysis plan"},{ref:"1.4",description:"Specify methodology and anticipated recents in analysis plan"},{ref:"1.5",description:"Document software versions and dependencies in analysis plan"},{ref:"1.5",description:"Document references in analysis plan"}]},{number:"2",title:"Data Preparation",tasks:[{ref:"2.1",description:"Obtain/upload source data files"},{ref:"2.2",description:"Perform data import and integrity checks"},{ref:"2.3",description:"Map data to CDISC SDTM/ADaM standards (if applicable)"},{ref:"2.4",description:"Create analysis-ready NONMEM dataset (required columns: ID, TIME, DV, AMT, CMT, EVID, MDV, covariates)"},{ref:"2.5",description:"Document data derivations and assumptions"},{ref:"2.6",description:"Generate data specification document"}]},{number:"3",title:"Exploratory Data Analysis (EDA)",tasks:[{ref:"3.1",description:"Generate summary statistics (demographics, dosing, PK concentrations)"},{ref:"3.2",description:"Plot concentration-time profiles (individual and population-level, linear and semi-log)"},{ref:"3.3",description:"Assess dose proportionality"},{ref:"3.4",description:"Identify potential outliers and BQL handling strategy"},{ref:"3.5",description:"Explore covariate distributions and correlations"},{ref:"3.6",description:"Assess data richness and sampling adequacy"},{ref:"3.7",description:"Generate EDA summary report with preliminary observations"}]},{number:"4",title:"Non-Compartmental Analysis (NCA)",tasks:[{ref:"4.1",description:"Perform NCA using validated R package (PKNCA) or NONMEM"},{ref:"4.2",description:"Estimate key PK parameters: CL/F, Vd/F, AUC, Cmax, Tmax, t½"},{ref:"4.3",description:"Tabulate NCA results by dose group"},{ref:"4.4",description:"Use NCA estimates as initial parameter estimates for compartmental modeling"},{ref:"4.5",description:"Document NCA methodology and results"}]},{number:"5",title:"Base Structural Model Selection",tasks:[{ref:"5.1",description:"Create NONMEM control stream for 1-compartment model (first-order absorption)"},{ref:"5.2",description:"Create NONMEM control stream for 2-compartment model (first-order absorption)"},{ref:"5.3",description:"Create NONMEM control stream for 1-compartment model (transit absorption, if applicable)"},{ref:"5.4",description:"Execute all base model runs"},{ref:"5.5",description:"Retrieve and compile results (OFV, AIC, BIC, parameter estimates, %RSE)"},{ref:"5.6",description:"Compare models using OFV, AIC, BIC, and diagnostic plots"},{ref:"5.7",description:"Select best structural model with scientific justification"},{ref:"5.8",description:"Document model selection rationale"}]},{number:"6",title:"Random Effects Model Development",tasks:[{ref:"6.1",description:"Add IIV on CL, V (and Ka, Q, V2 as applicable)"},{ref:"6.2",description:"Evaluate IIV on each parameter individually and in combination"},{ref:"6.3",description:"Test different omega structures (diagonal, block)"},{ref:"6.4",description:"Evaluate residual error models (additive, proportional, combined)"},{ref:"6.5",description:"Select best random effects structure based on ΔOFV > 3.84 (p<0.05)"},{ref:"6.6",description:"Document random effects model development"}]},{number:"7",title:"Covariate Analysis",tasks:[{ref:"7.1",description:"Perform graphical covariate screening (ETAs vs covariates)"},{ref:"7.2",description:"Test body weight effect on CL and V (allometric scaling)"},{ref:"7.3",description:"Evaluate additional covariates: age, sex, renal function, hepatic function"},{ref:"7.4",description:"Perform forward inclusion (ΔOFV > 3.84, p<0.05)"},{ref:"7.5",description:"Perform backward elimination (ΔOFV > 6.63, p<0.01)"},{ref:"7.6",description:"Build full and reduced (final) covariate models"},{ref:"7.7",description:"Tabulate covariate analysis results (parameter, ΔOFV, p-value, % change)"},{ref:"7.8",description:"Select covariates with clinical and statistical justification"},{ref:"7.9",description:"Document covariate analysis methodology and results"}]},{number:"8",title:"Final Model Refinement",tasks:[{ref:"8.1",description:"Refine final model parameterization"},{ref:"8.2",description:"Verify model convergence and successful minimization"},{ref:"8.3",description:"Check condition number (< 1000 acceptable)"},{ref:"8.4",description:"Verify parameter estimates are physiologically plausible"},{ref:"8.5",description:"Ensure %RSE values indicate acceptable precision"},{ref:"8.6",description:"Run final model with $COV step for variance-covariance matrix"},{ref:"8.7",description:"Document final model specification"}]},{number:"9",title:"Model Diagnostics & Goodness-of-Fit",tasks:[{ref:"9.1",description:"Generate standard GOF plots (DV vs PRED, DV vs IPRED, CWRES vs TIME/PRED)"},{ref:"9.2",description:"Generate ETA distribution plots (histograms, boxplots)"},{ref:"9.3",description:"Generate ETA correlation plots (ETA vs ETA scatter matrix)"},{ref:"9.4",description:"Generate ETA vs covariate plots (post-final model)"},{ref:"9.5",description:"Generate individual fit plots for representative subjects"},{ref:"9.6",description:"Create parameter estimate table with %RSE and 95% CI"},{ref:"9.7",description:"Compile all diagnostics into a summary report"}]},{number:"10",title:"Visual Predictive Check (VPC) & Model Qualification",tasks:[{ref:"10.1",description:"Simulate 500–1000 replicates from the final model"},{ref:"10.2",description:"Generate VPC plots (observed percentiles vs simulated prediction intervals: 5th, 50th, 95th)"},{ref:"10.3",description:"Generate pcVPC (prediction-corrected VPC) if applicable"},{ref:"10.4",description:"Assess VPC for adequate model performance across dose groups"},{ref:"10.5",description:"Generate numerical predictive check (NPC) if appropriate"},{ref:"10.6",description:"Document model qualification results and conclusions"},{ref:"10.7",description:"Final model confirmed adequate for intended use"}]},{number:"11",title:"Reporting & Communication",tasks:[{ref:"11.1",description:"Prepare full pharmacometrics final analysis report (Word): background, methods, results, discussion, conclusions, appendices"},{ref:"11.2",description:"Prepare PowerPoint presentation: objectives, methods, EDA, model development, final parameters, GOF/VPC, conclusions"},{ref:"11.3",description:"Generate Data Analysis Plan (DAP) if not previously created"},{ref:"11.4",description:"QC review of all deliverables (report, presentation, scripts, data)"},{ref:"11.5",description:"Address QC findings and finalize all documents"},{ref:"11.6",description:"Archive all analysis files with version control"}]}];async function W(t){const{data:e,error:i}=await n.from("sessions").insert({name:t.name,compound:t.compound||null,software_stack:t.software_stack||null,analysis_type:t.analysis_type||null,hitl_enabled:t.hitl_enabled??!0,status:"active"}).select().single();if(i)throw i;return e}async function R(){const{data:t,error:e}=await n.from("sessions").select("*").order("created_at",{ascending:!1});if(e)throw e;return t??[]}async function q(t,e){const{error:i}=await n.from("sessions").update({...e,updated_at:new Date().toISOString()}).eq("id",t);if(i)throw i}async function ye(t){const{data:e,error:i}=await n.from("checklist_items").select("*").eq("session_id",t).order("sort_order",{ascending:!0});if(i)throw i;return e??[]}async function De(t){const e=[];let i=0;for(const r of H){e.push({session_id:t,section_number:r.number,section_title:r.title,item_ref:r.number,description:r.title,status:"pending",item_type:"section",sort_order:i++});for(const o of r.tasks)e.push({session_id:t,section_number:r.number,section_title:r.title,item_ref:o.ref,description:o.description,status:"pending",item_type:"task",sort_order:i++})}const{data:s,error:a}=await n.from("checklist_items").insert(e).select();if(a)throw a;return s??[]}async function ve(t,e){const{error:i}=await n.from("checklist_items").update({...e,updated_at:new Date().toISOString()}).eq("id",t);if(i)throw i}async function be(t,e){const{data:i,error:s}=await n.from("checklist_items").insert(e).select().single();if(s)throw s;return i}async function we(t){const{data:e,error:i}=await n.from("checklist_items").select("*").eq("session_id",t).eq("status","pending").eq("item_type","task").order("sort_order",{ascending:!0}).limit(1).single();if(i&&i.code!=="PGRST116")throw i;return e||null}async function Fe(t){const{data:e,error:i}=await n.from("artifacts").select("*").eq("session_id",t).order("created_at",{ascending:!0});if(i)throw i;return e??[]}async function K(t,e){const{data:i,error:s}=await n.from("artifacts").insert({session_id:t,...e}).select().single();if(s)throw s;return i}async function Ue(t){const{error:e}=await n.from("checklist_items").delete().eq("id",t);if(e)throw e}async function ke(t,e){const{error:i}=await n.from("checklist_items").delete().eq("session_id",t).eq("section_number",e);if(i)throw i}async function j(t){const{error:e}=await n.from("messages").delete().eq("session_id",t);if(e)throw e;const{error:i}=await n.from("checklist_items").delete().eq("session_id",t);if(i)throw i;const{error:s}=await n.from("artifacts").delete().eq("session_id",t);if(s)throw s;const{error:a}=await n.from("sessions").delete().eq("id",t);if(a)throw a}async function J(t){const{data:e,error:i}=await n.from("sessions").insert({name:`${t.name} (Copy)`,compound:t.compound??null,software_stack:t.software_stack??null,analysis_type:t.analysis_type??null,hitl_enabled:t.hitl_enabled,status:"active"}).select().single();if(i)throw i;const{data:s,error:a}=await n.from("checklist_items").select("*").eq("session_id",t.id).order("sort_order",{ascending:!0});if(a)throw a;if(s&&s.length>0){const r=s.map(({id:p,created_at:_,updated_at:I,session_id:S,...T})=>({...T,session_id:e.id})),{error:o}=await n.from("checklist_items").insert(r);if(o)throw o}return e}const $=d.lazy(()=>h(()=>import("./SessionList-9P-T7NnA.js"),__vite__mapDeps([0,1,2,3]))),z=d.lazy(()=>h(()=>import("./AnalysisWorkspace-DubNutQ8.js"),__vite__mapDeps([4,1,5,2,6,3])));function Q(){const[t,e]=d.useState([]),[i,s]=d.useState(null),[a,r]=d.useState(!1),[o,p]=d.useState(!0);d.useEffect(()=>{R().then(e).catch(console.error).finally(()=>p(!1))},[]);const _=async l=>{p(!0);try{const{datasetFile:c,...u}=l,f=await W(u);if(c){const O=await c.text();await K(f.id,{path:`Data/${c.name}`,artifact_type:"dataset",content:O,metadata:{originalName:c.name,size:c.size,uploadedAt:new Date().toISOString()}})}e(O=>[f,...O]),r(!0),s(f)}catch(c){console.error(c)}finally{p(!1)}},I=l=>{r(!1),s(l)},S=async(l,c)=>{await q(l,{name:c}),e(u=>u.map(f=>f.id===l?{...f,name:c}:f))},T=async l=>{const c=await J(l);e(u=>[c,...u])},y=async l=>{await j(l),e(c=>c.filter(u=>u.id!==l))},D=async()=>{r(!1),s(null);const l=await R();e(l)};return i?m.jsx(d.Suspense,{fallback:null,children:m.jsx(z,{session:i,isNewSession:a,onBack:D})}):m.jsx(d.Suspense,{fallback:null,children:m.jsx($,{sessions:t,onSelect:I,onCreate:_,onRename:S,onDuplicate:T,onDelete:y,loading:o})})}L(document.getElementById("root")).render(m.jsx(d.StrictMode,{children:m.jsx(Q,{})}));export{Ie as A,Te as B,be as C,de as D,ge as E,me as F,Oe as G,Re as H,he as I,q as J,fe as L,pe as M,oe as O,Ne as P,Ce as R,P as S,Se as a,_e as b,Pe as c,Ae as d,ke as e,Ue as f,ne as g,ce as h,le as i,m as j,te as k,se as l,ae as m,G as n,ye as o,Fe as p,K as q,re as r,n as s,ie as t,ve as u,Le as v,De as w,ue as x,we as y,Ee as z};
