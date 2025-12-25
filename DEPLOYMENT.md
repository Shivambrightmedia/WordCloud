# Production Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Free)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. For production:
   ```bash
   vercel --prod
   ```

### Option 2: Netlify (Free)

1. Build the project:
   ```bash
   npm run build
   ```

2. Drag and drop the `dist` folder to Netlify Dashboard

Or use Netlify CLI:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option 3: GitHub Pages

1. Add to package.json:
   ```json
   "homepage": "https://yourusername.github.io/word-portrait",
   ```

2. Update vite.config.js base:
   ```javascript
   base: '/word-portrait/',
   ```

3. Build and deploy:
   ```bash
   npm run build
   # Push dist folder to gh-pages branch
   ```

### Option 4: Docker

```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t word-portrait .
docker run -p 8080:80 word-portrait
```

---

## 📋 Pre-Deployment Checklist

### Required
- [x] Build succeeds without errors (`npm run build`)
- [x] SEO meta tags added
- [x] Favicon added
- [x] Error handling implemented
- [x] robots.txt added
- [x] Security headers added

### Recommended
- [ ] Add Google Analytics (replace UA-XXXXX)
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Add cookie consent banner (if using analytics)
- [ ] Create og-image.png (1200x630 px)
- [ ] Create apple-touch-icon.png (180x180 px)
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Performance audit with Lighthouse

### Optional
- [ ] Add PWA support (service worker)
- [ ] Add sitemap.xml
- [ ] Set up CDN for assets
- [ ] Configure rate limiting (if adding backend)

---

## 🔒 Security Checklist

- [x] X-Content-Type-Options header
- [x] X-Frame-Options header
- [ ] Content-Security-Policy (configure per deployment)
- [ ] HTTPS (handled by hosting provider)

---

## 📊 Performance Tips

1. **Image Optimization**: Use WebP format for OG images
2. **Font Loading**: Fonts are already preloaded
3. **Code Splitting**: Vite handles this automatically
4. **Caching**: Configure cache headers on hosting provider

---

## 🌐 Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Netlify
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS

### Cloudflare (for CDN)
1. Add site to Cloudflare
2. Update nameservers
3. Enable caching and optimization

---

## 📈 Monitoring

### Free Options
- **Uptime**: UptimeRobot, Pingdom
- **Analytics**: Google Analytics, Plausible
- **Errors**: Sentry (free tier)

### Setup Analytics
Add to index.html before </head>:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```
