#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const args = Object.fromEntries(process.argv.slice(2).map((v,i,a)=>v.startsWith("--")?[v.slice(2),a[i+1]]:null).filter(Boolean));
if (!args.report) throw new Error("Usage: node scripts/audit-dependency-licenses.mjs --report <checker-json>");
const sbom = JSON.parse(fs.readFileSync("docs/phase-00/sbom/bun-lock.cdx.json","utf8"));
const checker = JSON.parse(fs.readFileSync(args.report,"utf8"));
const expected = new Map((sbom.components||[]).map(c=>[c.name+"@"+c.version,c]));
const permissive = new Set(["MIT","Apache-2.0","BSD-2-Clause","BSD-3-Clause","ISC","0BSD","CC0-1.0","Unlicense","Zlib","BlueOak-1.0.0"]);
const strong = /\b(AGPL|GPL|SSPL|EUPL|OSL|CPAL)(?:[- ]|$)/i;
const weak = /\b(LGPL|MPL|EPL|CDDL|CPL|RPL)(?:[- ]|$)/i;
const noticeName = /^(NOTICE|NOTICE\.txt|NOTICE\.md|THIRD[-_ ]PARTY[-_ ]NOTICES(?:\..*)?|COPYING(?:\..*)?)$/i;
const rows=[];
function licensesOf(v){return Array.isArray(v)?v.map(String):(typeof v==="string"&&v.trim()?[v.trim()]:[]);}
function riskOf(ls,file){
 const s=ls.join(" OR ").trim();
 if(!s||/\b(UNKNOWN|NOASSERTION|UNLICENSED|SEE LICENSE IN)\b/i.test(s)) return "UNKNOWN";
 if(strong.test(s)) return "HIGH_REVIEW";
 if(weak.test(s)) return "COPYLEFT_REVIEW";
 const ids=s.split(/\s+(?:OR|AND)\s+|[()]/i).map(x=>x.trim()).filter(Boolean);
 if(ids.length&&ids.every(x=>permissive.has(x))) return file?"LOW_RISK_ATTRIBUTION_CHECK":"REVIEW_LICENSE_FILE_MISSING";
 return "MANUAL_REVIEW";
}
for(const [key,info] of Object.entries(checker)){
 const name=info.name||key.slice(0,key.lastIndexOf("@"));
 const version=info.version||key.slice(key.lastIndexOf("@")+1);
 const modulePath=info.path||"";
 let notices=[];
 if(modulePath&&fs.existsSync(modulePath)){try{notices=fs.readdirSync(modulePath).filter(n=>noticeName.test(n)).map(n=>path.join(modulePath,n));}catch{}}
 const licenses=licensesOf(info.licenses);
 rows.push({name,version,licenses,risk:riskOf(licenses,info.licenseFile),licenseFile:info.licenseFile||null,noticeFiles:notices,repository:info.repository||null,packagePath:modulePath||null});
}
rows.sort((a,b)=>a.name.localeCompare(b.name)||a.version.localeCompare(b.version));
const found=new Set(rows.map(r=>r.name+"@"+r.version));
const missing=[...expected.keys()].filter(k=>!found.has(k));
const extra=[...found].filter(k=>!expected.has(k));
const summary=rows.reduce((a,r)=>(a[r.risk]=(a[r.risk]||0)+1,a),{});
const result={schemaVersion:1,generatedAt:new Date().toISOString(),source:{lockfile:"bun.lock",sbom:"docs/phase-00/sbom/bun-lock.cdx.json",lockfileBlobSha:(sbom.metadata?.properties||[]).find(p=>p.name==="source:lockfile_blob_sha")?.value||null},reconciliation:{expectedUniqueResolvedPackages:expected.size,inspectedInstalledPackages:rows.length,missingFromInstalledTree:missing,unexpectedInstalledPackages:extra,exactSetMatch:missing.length===0&&extra.length===0},summary,packages:rows,caveats:["Metadata and package files can be incomplete or inaccurate; publisher evidence may be needed.","Risk labels are triage only; review SPDX expressions and actual license text before approval.","NOTICE/COPYING presence alone does not prove a legal requirement; absence does not prove no attribution duty.","Platform-specific optional packages may differ by runner; any unexplained mismatch keeps the audit open."]};
fs.mkdirSync("docs/phase-00/reports",{recursive:true});
fs.writeFileSync("docs/phase-00/reports/dependency-license-review.json",JSON.stringify(result,null,2)+"\n");
const lines=["# Dependency & License Risk Review","","Generated: "+result.generatedAt,"","## Reconciliation","", "- SBOM expected: **"+expected.size+"** unique exact package coordinates","- Installed tree inspected: **"+rows.length+"**","- Exact set match: **"+(result.reconciliation.exactSetMatch?"YES":"NO")+"**","- Missing: **"+missing.length+"**","- Unexpected: **"+extra.length+"**","","## Risk triage","",...Object.entries(summary).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>"- "+k+": "+v),"","## Packages requiring review","","| Package | Version | License | Risk | LICENSE | NOTICE/COPYING |","|---|---:|---|---|---|---|",...rows.filter(r=>r.risk!=="LOW_RISK_ATTRIBUTION_CHECK").map(r=>"| "+r.name+" | "+r.version+" | "+(r.licenses.join(" ; ")||"UNKNOWN")+" | **"+r.risk+"** | "+(r.licenseFile?"present":"not found")+" | "+(r.noticeFiles.map(n=>path.basename(n)).join(", ")||"not found")+" |"),"","## Limitations","","- Scan includes direct, transitive and development dependencies; exact coordinates are reconciled against the committed SBOM.","- Unknown, compound, guessed, custom or non-SPDX expressions remain for manual review.","- Strong/weak copyleft is flagged, not automatically rejected.","- NOTICE/COPYING files are inventoried; assess obligations against actual license text and distribution context.","- This is technical triage, not legal advice.","","Full evidence: dependency-license-review.json."];
fs.writeFileSync("docs/phase-00/reports/dependency-license-review.md",lines.join("\n")+"\n");
if(!result.reconciliation.exactSetMatch){console.error(JSON.stringify(result.reconciliation,null,2));process.exitCode=2;}else console.log(JSON.stringify({reconciliation:result.reconciliation,summary},null,2));
