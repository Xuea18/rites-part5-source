import { defineConfig } from 'vite';
// B: deploy independently alongside the unchanged root demonstration.
// 本地开发默认 base '/b/'；部署到 GitHub Pages 时由 CI 注入: PAGES_BASE=/<仓库名>/ → '/<仓库名>/b/'
const BASE=(process.env.PAGES_BASE||'/')+'b/';
export default defineConfig({base:BASE});
