# melondy101.github.io

黄毅的个人作品集与写作站，部署在 GitHub Pages。

## 更新内容

- 项目内容位于 `scripts/build.mjs` 的 `projects` 配置。
- 新文章直接放进 `content/writing/`，使用 `.md` 文件；复制 `_template.md` 并填写标题、日期和分类即可。构建会自动生成文章页并加入 Writing 列表。
- 运行 `npm run build` 后，在 `dist/` 查看静态输出。

推送到 `main` 会触发 GitHub Pages 发布工作流。
