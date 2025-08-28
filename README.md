# XooCreator
XooCreator game - An Angular-based creature builder application

## Deployment

This app is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main`, `DEV`, or `square-mages` branches.

**Live URL:** https://marianterinte.github.io/XooCreator/

### Development

To run the app locally:

```bash
cd xoo-creator
npm install
npm start
```

The app will be available at `http://localhost:4200/`

### Building for Production

```bash
cd xoo-creator
npm run build -- --base-href="/XooCreator/"
```

Build output will be in `xoo-creator/dist/xoo-creator/browser/`
