import { allPages, allPaintings, allPosts } from ".contentlayer/generated";
import fs from 'fs';


fs.writeFileSync('./dist/dataset.json', JSON.stringify({
  posts: allPosts,
  pages: allPages,
  paintings: allPaintings
}))
