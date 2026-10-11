import http from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,dirname,extname,sep} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../dist");
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".webp":"image/webp",".png":"image/png"};
http.createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const file=resolve(root,"."+path+(path.endsWith("/")?"index.html":""));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return}
  const data=await readFile(file);
  res.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream","X-Content-Type-Options":"nosniff","Cache-Control":"no-store"});res.end(data);
 }catch{res.writeHead(404,{"Content-Type":"text/plain"});res.end("Not found")}
}).listen(4173,"127.0.0.1",()=>console.log("Pro Fitness preview: http://127.0.0.1:4173/"));
