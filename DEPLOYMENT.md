# Deployment Guide (Vercel)

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Supabase project set up and running
3. All environment variables ready

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **Import project to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect it's a SvelteKit project

3. **Configure environment variables**
   - In the "Environment Variables" section, add:
     - `PUBLIC_SUPABASE_URL` = Your Supabase project URL
     - `PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
     - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
   - Make sure to add them for Production, Preview, and Development environments

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Link to existing project or create new
   - Add environment variables when prompted

4. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Environment Variables

Make sure these are set in your Vercel project settings:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret!) | Supabase Dashboard → Settings → API |

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Automatic Deployments

Once connected to GitHub:
- Every push to `main` branch triggers a production deployment
- Every push to other branches creates a preview deployment
- Pull requests get their own preview URLs

## Monitoring

- View deployment logs in Vercel dashboard
- Monitor function execution and errors
- Check analytics for traffic and performance

## Rollback

If something goes wrong:
1. Go to Deployments in Vercel dashboard
2. Find the previous working deployment
3. Click "Promote to Production"

## Notes

- The Vercel adapter is already configured in `svelte.config.js`
- Edge functions are supported for API routes
- Static assets are automatically optimized
- Preview deployments are great for testing before production
