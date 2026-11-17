#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const args=Object.fromEntries(process.argv.slice(2).map((v,i,a)=>v.startsWith("--")?[v.slice(2),a[i+1]]:null).filter(Boolean));
if(!args.report) throw new Error("Usage: node scripts/audit-dependency-licenses.mjs --report <checker-json>");
const sbom=JSON.parse(fs.readFileSync("docs/phase-00/sbom/bun-lock.cdx.json","utf8"));
const checker=JSON.parse(fs.readFileSync(args.report,"utf8"));
const expected=new Map((sbom.components||[]).filter(c=>c.type==="library").map(c=>[c.name+"@"+c.version,c]));
const permissive=new Set(["MIT","Apache-2.0","BSD-2-Clause","BSD-3-Clause","ISC","0BSD","CC0-1.0","Unlicense","Zlib","BlueOak-1.0.0"]);
const strong=/\b(AGPL|GPL|SSPL|EUPL|OSL|CPAL)(?:[- ]|$)/i;
const weak=/\b(LGPL|MPL|EPL|CDDL|CPL|RPL)(?:[- ]|$)/i;
const noticeName=/^(NOTICE|NOTICE\.txt|NOTICE\.md|THIRD[-_ ]PARTY[-_ ]NOTICES(?:\..*)?|COPYING(?:\..*)?)$/i;
const rows=[];
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"agentzy-license-"));
const noticeOut="docs/phase-00/reports/upstream-notices";
fs.mkdirSync(noticeOut,{recursive:true});
function licensesOf(v){if(Array.isArray(v))return v.map(String);if(typeof v==="string"&&v.trim())return[v.trim()];if(v&&typeof v==="object"&&v.type)return[String(v.type)];return[];}
function riskOf(ls,file){const s=ls.join(" OR ").trim();if(!s||/\b(UNKNOWN|NOASSERTION|UNLICENSED|SEE LICENSE IN)\b/i.test(s))return"UNKNOWN";if(strong.test(s))return"HIGH_REVIEW";if(weak.test(s))return"COPYLEFT_REVIEW";const ids=s.split(/\s+(?:OR|AND)\s+|[()]/i).map(x=>x.trim()).filter(Boolean);if(ids.length&&ids.every(x=>permissive.has(x)))return file?"LOW_RISK_ATTRIBUTION_CHECK":"REVIEW_LICENSE_FILE_MISSING";return"MANUAL_REVIEW";}
function inspectNoticeFiles(modulePath,name,version){if(!modulePath||!fs.existsSync(modulePath))return[];try{return fs.readdirSync(modulePath).filter(n=>noticeName.test(n)).map(n=>{const source=path.join(modulePath,n),target=path.join(noticeOut,safeFileName(name+"-"+version+"-"+n));fs.copyFileSync(source,target);return target;});}catch{return[];}}
function safeFileName(s){return s.replace(/[^a-zA-Z0-9._-]+/g,"_");}
async function registryEvidence(name,version){
 const encoded=encodeURIComponent(name).replace(/%40/g,"@");
 const url="https://registry.npmjs.org/"+encoded+"/"+encodeURIComponent(version);
 const response=await fetch(url,{headers:{"accept":"application/json"}});
 if(!response.ok)throw new Error("npm registry "+response.status+" for "+name+"@"+version);
 const meta=await response.json();
 const license=licensesOf(meta.license);
 let licenseFile=null,notices=[],tarballEvidence=null;
 const tarball=meta.dist?.tarball;
 if(tarball){
  const res=await fetch(tarball);
  if(res.ok){
   const archive=path.join(temp,safeFileName(name+"-"+version)+".tgz");
   fs.writeFileSync(archive,Buffer.from(await res.arrayBuffer()));
   let entries=[];
   try{entries=execFileSync("tar",["-tzf",archive],{encoding:"utf8",maxBuffer:8*1024*1024}).split(/\r?\n/).filter(Boolean);}catch{}
   const licenseEntry=entries.find(e=>/^package\/(?:LICENSE|LICENCE|COPYING)(?:\.[^/]*)?$/i.test(e));
   const noticeEntries=entries.filter(e=>/^package\/(?:NOTICE(?:\.[^/]*)?|THIRD[-_ ]PARTY[-_ ]NOTICES(?:\.[^/]*)?|COPYING(?:\.[^/]*)?)$/i.test(e));
   const evidenceEntries=[...new Set([...(licenseEntry?[licenseEntry]:[]),...noticeEntries])];
   for(const entry of evidenceEntries){
    const content=execFileSync("tar",["-xOzf",archive,entry],{encoding:"utf8",maxBuffer:2*1024*1024});
    const target=path.join(noticeOut,safeFileName(name+"-"+version+"-"+path.basename(entry)));
    fs.writeFileSync(target,content);
    if(entry===licenseEntry)licenseFile=target;
    if(noticeEntries.includes(entry))notices.push(target);
   }
   tarballEvidence=meta.dist.integrity||meta.dist.shasum||null;
  }
 }
 return {licenses:license,licenseFile,noticeFiles:notices,repository:typeof meta.repository==="string"?meta.repository:meta.repository?.url||null,os:meta.os||null,cpu:meta.cpu||null,evidenceSource:"npm registry version metadata and package tarball",tarballIntegrity:tarballEvidence};
}
async function pooled(items,limit,fn){let i=0;const workers=Array.from({length:limit},async()=>{while(i<items.length){const item=items[i++];await fn(item);}});await Promise.all(workers);}
for(const [key,info] of Object.entries(checker)){
 const name=info.name||key.slice(0,key.lastIndexOf("@"));
 const version=info.version||key.slice(key.lastIndexOf("@")+1);
 if(!expected.has(name+"@"+version))continue;
 const licenses=licensesOf(info.licenses);
 const modulePath=info.path||"";
 rows.push({name,version,licenses,risk:riskOf(licenses,info.licenseFile),licenseFile:info.licenseFile||null,noticeFiles:inspectNoticeFiles(modulePath,name,version),copyright:info.copyright||null,publisher:info.publisher||null,repository:info.repository||null,packagePath:modulePath||null,evidenceSource:"installed node_modules package metadata and files"});
}
// Re-inspect flagged installed packages from their exact registry tarballs so missing
// LICENSE files and package-provided NOTICE/COPYING files are not silently skipped.
const installedFlagged=rows.filter(r=>r.evidenceSource.startsWith("installed ")&&(r.risk!=="LOW_RISK_ATTRIBUTION_CHECK"||!r.licenseFile));
await pooled(installedFlagged,6,async row=>{
 try{
  const meta=await registryEvidence(row.name,row.version);
  if(!row.licenses.length&&meta.licenses.length)row.licenses=meta.licenses;
  if(!row.licenseFile&&meta.licenseFile)row.licenseFile=meta.licenseFile;
  row.noticeFiles=[...new Set([...(row.noticeFiles||[]),...meta.noticeFiles])];
  row.risk=riskOf(row.licenses,row.licenseFile);
  row.tarballIntegrity=meta.tarballIntegrity;
  row.registryEvidence=meta.evidenceSource;
 }catch(error){row.registryReviewError=String(error);}
});
for(const row of rows){
 if(row.licenseFile&&row.licenseFile.startsWith("/tmp/")&&fs.existsSync(row.licenseFile)){
  const target=path.join(noticeOut,safeFileName(row.name+"-"+row.version+"-LICENSE.txt"));
  fs.copyFileSync(row.licenseFile,target);
  row.licenseFile=target;
 }
}
const found=new Set(rows.map(r=>r.name+"@"+r.version));
const missing=[...expected.keys()].filter(k=>!found.has(k));
const registryErrors=[];
await pooled(missing,8,async id=>{
 const split=id.lastIndexOf("@"),name=id.slice(0,split),version=id.slice(split+1);
 try{
  const meta=await registryEvidence(name,version);
  rows.push({name,version,licenses:meta.licenses,risk:riskOf(meta.licenses,meta.licenseFile),licenseFile:meta.licenseFile,noticeFiles:meta.noticeFiles,repository:meta.repository,platform:{os:meta.os,cpu:meta.cpu},evidenceSource:meta.evidenceSource,tarballIntegrity:meta.tarballIntegrity});
 }catch(error){registryErrors.push({package:id,error:String(error)});rows.push({name,version,licenses:[],risk:"UNKNOWN",licenseFile:null,noticeFiles:[],evidenceSource:"registry lookup failed",error:String(error)});}
});
rows.sort((a,b)=>a.name.localeCompare(b.name)||a.version.localeCompare(b.version));
const reconciled=new Set(rows.map(r=>r.name+"@"+r.version));
const stillMissing=[...expected.keys()].filter(k=>!reconciled.has(k));
const summary=rows.reduce((a,r)=>(a[r.risk]=(a[r.risk]||0)+1,a),{});
const secondaryErrors=rows.filter(r=>r.registryReviewError).map(r=>({package:r.name+"@"+r.version,error:r.registryReviewError}));
// Preserve all detected upstream license texts in one durable, package-indexed repository file.
const bundlePath="docs/phase-00/reports/THIRD_PARTY_LICENSES.generated.md";
const fence=String.fromCharCode(96).repeat(3);
const bundle=["# Third-Party License Texts","", "Generated from the resolved Agentzy dependency tree. Package/version headings identify the upstream component; license text is reproduced from the detected package LICENSE file or exact npm package tarball.", ""];
let bundled=0;
for(const row of rows){
 if(row.licenseFile&&fs.existsSync(row.licenseFile)){
  const licenseText=fs.readFileSync(row.licenseFile,"utf8");
  const anchor=(row.name+"-"+row.version).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  bundle.push("## "+row.name+"@"+row.version,"","License: "+(row.licenses.join(" OR ")||"Unresolved"),"","<a id=\""+anchor+"\"></a>","",fence+"text",licenseText.trimEnd(),fence,"");
  row.licenseTextSha256=crypto.createHash("sha256").update(licenseText).digest("hex");
  row.licenseFile=bundlePath+"#"+anchor;
  bundled++;
 }else if(row.licenseFile&&row.licenseFile.startsWith("/tmp/"))row.licenseFile=null;
}
fs.writeFileSync(bundlePath,bundle.join("\n")+"\n");
const result={schemaVersion:3,licenseTextsBundled:bundled,generatedAt:new Date().toISOString(),source:{lockfile:"bun.lock",sbom:"docs/phase-00/sbom/bun-lock.cdx.json",lockfileBlobSha:(sbom.metadata?.properties||[]).find(p=>p.name==="source:lockfile_blob_sha")?.value||null},reconciliation:{expectedUniqueResolvedPackages:expected.size,installedTreePackages:found.size,registryFallbackPackages:missing.length,reviewedPackageCoordinates:rows.length,unresolvedRegistryLookups:[...registryErrors,...secondaryErrors],missingAfterFallback:stillMissing,exactSetMatch:stillMissing.length===0,evidenceComplete:stillMissing.length===0&&registryErrors.length===0&&secondaryErrors.length===0},summary,packages:rows,caveats:["Bun installs only packages applicable to the runner OS/CPU; missing lockfile coordinates are reconciled from exact npm registry version metadata and tarballs.","Package metadata can be incomplete or inaccurate; registry evidence does not replace publisher confirmation where ambiguous.","Risk labels are triage only. Review SPDX expressions, actual license text, and distribution context before approval.","NOTICE/COPYING presence is recorded; presence alone does not prove a legal requirement, and absence does not prove no attribution duty."]};
fs.mkdirSync("docs/phase-00/reports",{recursive:true});
fs.writeFileSync("docs/phase-00/reports/dependency-license-review.json",JSON.stringify(result,null,2)+"\n");
const lines=["# Dependency & License Risk Review","","Generated: "+result.generatedAt,"","## Reconciliation","", "- SBOM expected: **"+expected.size+"** exact package coordinates","- Installed node_modules tree: **"+found.size+"**","- Registry fallback: **"+missing.length+"**","- Total reviewed: **"+rows.length+"**","- Exact set match after fallback: **"+(result.reconciliation.exactSetMatch?"YES":"NO")+"**","- Unresolved registry lookups: **"+registryErrors.length+"**","","## Risk triage","",...Object.entries(summary).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>"- "+k+": "+v),"","## Packages requiring review","","| Package | Version | License | Risk | LICENSE | NOTICE/COPYING | Evidence |","|---|---:|---|---|---|---|---|",...rows.filter(r=>r.risk!=="LOW_RISK_ATTRIBUTION_CHECK").map(r=>"| "+r.name+" | "+r.version+" | "+(r.licenses.join(" ; ")||"UNKNOWN")+" | **"+r.risk+"** | "+(r.licenseFile?"present":"not found")+" | "+(r.noticeFiles.map(n=>path.basename(n)).join(", ")||"not found")+" | "+r.evidenceSource+" |"),"","## Limitations","","- Installed tree covers this runner; lockfile coordinates absent due platform-specific optional dependencies are checked against exact npm registry version metadata and tarballs.","- Unknown, compound, guessed, custom, non-SPDX or unavailable metadata remain for manual review.","- Strong/weak copyleft is flagged, not automatically rejected.","- NOTICE/COPYING files are inventoried; assess obligations against actual license text and distribution context.","- This is technical triage, not legal advice.","","Full per-package evidence: dependency-license-review.json."];
fs.writeFileSync("docs/phase-00/reports/dependency-license-review.md",lines.join("\n")+"\n");
fs.rmSync(temp,{recursive:true,force:true});
if(!result.reconciliation.evidenceComplete){console.error(JSON.stringify(result.reconciliation,null,2));process.exitCode=2;}else console.log(JSON.stringify({reconciliation:result.reconciliation,summary},null,2));
