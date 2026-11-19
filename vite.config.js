import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
const shared=path.resolve(import.meta.dirname,'../public/assets/xuan');
const files=new Set(['gong','xuan','pan','te'].flatMap(n=>[`${n}-xuan-anim.webp`,`${n}-xuan-poster.png`,`${n}-xuan.m4a`]));
const sharedXuan={name:'shared-xuan-media',configureServer(server){server.middlewares.use((req,res,next)=>{const pathname=(req.url||'').split('?')[0],name=pathname.split('/').pop();if(!/^\/(b\/)?assets\/xuan\//.test(pathname)||!files.has(name))return next();const file=path.join(shared,name);if(!fs.existsSync(file))return next();res.setHeader('Content-Type',name.endsWith('.m4a')?'audio/mp4':name.endsWith('.png')?'image/png':'image/webp');res.setHeader('Content-Length',fs.statSync(file).size);fs.createReadStream(file).pipe(res);});},generateBundle(){for(const name of files)this.emitFile({type:'asset',fileName:`assets/xuan/${name}`,source:fs.readFileSync(path.join(shared,name))});}};
// B: deploy independently alongside the unchanged root demonstration.
// 本地开发默认 base '/b/'；部署到 GitHub Pages 时由 CI 注入: PAGES_BASE=/<仓库名>/ → '/<仓库名>/b/'
const BASE=(process.env.PAGES_BASE||'/')+'b/';
export default defineConfig({base:BASE,plugins:[sharedXuan]});
