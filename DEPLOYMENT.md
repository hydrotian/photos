# GitHub Pages Deployment Setup

This guide walks you through setting up automatic deployment to GitHub Pages.

## Prerequisites

- Your code is pushed to GitHub
- You have admin access to the repository

## One-Time Setup

### 1. Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/hydrotian/photos`
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Pages**
4. Under **Build and deployment**:
   - **Source**: Select "GitHub Actions"
   - That's it! No need to select a branch when using GitHub Actions

### 2. Verify Workflow Permissions

1. Still in **Settings**, go to **Actions** → **General** (left sidebar)
2. Scroll down to **Workflow permissions**
3. Ensure either:
   - "Read and write permissions" is selected, OR
   - "Read repository contents and packages permissions" with "Allow GitHub Actions to create and approve pull requests" checked

### 3. Push Your Changes

The workflow is already set up in `.github/workflows/deploy.yml`. To trigger it:

```bash
# Make sure you're on the main branch
git checkout main

# Merge your changes (or push directly if you're working on main)
git merge claude/image-processing-categories-01EQsMFyu2RUeWYmTDrpt6wA

# Push to trigger the deployment
git push origin main
```

## How It Works

The GitHub Action will:

1. **Trigger** on every push to the `main` branch
2. **Install** Node.js 20 and dependencies
3. **Build** your SvelteKit site with `npm run build`
4. **Deploy** the `build/` folder to GitHub Pages

The entire process takes about 1-2 minutes.

## Monitoring Deployments

### View Workflow Status

1. Go to the **Actions** tab in your repository
2. You'll see all workflow runs
3. Click on any run to see detailed logs
4. Green checkmark = successful deployment
5. Red X = failed (click to see error logs)

### Access Your Site

After the first successful deployment, your site will be available at:

**https://hydrotian.github.io/photos/**

## Manual Deployment

You can also trigger a deployment manually:

1. Go to **Actions** tab
2. Click "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select branch (usually `main`)
5. Click "Run workflow"

## Troubleshooting

### Build Fails with "Cannot find module"

The workflow uses `npm ci` which requires `package-lock.json`. Make sure it's committed:

```bash
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Pages Not Showing Up

1. Check that the deployment succeeded in the Actions tab
2. Wait 1-2 minutes after deployment
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for errors

### 404 Errors on Pages

This usually means the base path is incorrect. The site is configured for `/photos` base path in `svelte.config.js`:

```javascript
paths: {
  base: process.env.NODE_ENV === 'production' ? '/photos' : ''
}
```

This matches your repository name. If you change the repo name, update this path.

### Sharp Installation Issues

If the build fails with sharp-related errors, the workflow will automatically handle platform-specific binaries. This is normal and should work automatically.

## Updating Your Site

Every time you push to `main`, the site automatically rebuilds and deploys:

```bash
# 1. Make your changes
npm run process-photos  # Add new photos

# 2. Commit
git add .
git commit -m "Add new photos"

# 3. Push to main
git push origin main

# 4. Wait ~2 minutes
# 5. Visit https://hydrotian.github.io/photos/
```

## Preview Deployments (Optional)

If you want to preview changes before merging to main:

1. Push to a feature branch
2. The site won't deploy (only `main` triggers deployment)
3. Test locally with `npm run build && npm run preview`
4. Merge to main when ready

## Custom Domain (Optional)

To use a custom domain like `photos.yourname.com`:

1. In repository **Settings** → **Pages**
2. Under **Custom domain**, enter your domain
3. Add DNS records at your domain provider:
   - Type: `CNAME`
   - Name: `photos` (or `@` for apex domain)
   - Value: `hydrotian.github.io`
4. Wait for DNS propagation (can take up to 24 hours)
5. Enable "Enforce HTTPS" after DNS is set up

## Environment Variables (If Needed)

If you need environment variables in the build:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add your secret
4. Reference in workflow:

```yaml
- name: Build
  env:
    NODE_ENV: production
    MY_SECRET: ${{ secrets.MY_SECRET }}
  run: npm run build
```

## Cost

GitHub Pages is **free** for public repositories with these limits:
- 1 GB storage
- 100 GB bandwidth per month
- 10 builds per hour

This is more than enough for a photography portfolio.

## Need Help?

- Check the [Actions tab](https://github.com/hydrotian/photos/actions) for build logs
- Review [GitHub Pages documentation](https://docs.github.com/en/pages)
- Open an issue in the repository
