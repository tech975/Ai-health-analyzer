# Chrome PDF Generation Fix for Render Deployment

## Issue
PDF downloads are failing with "Failed to generate document file" error due to Chrome/Puppeteer not being properly installed on Render.

## Changes Made

### 1. Updated Render Configuration (`server/render.yaml`)
- Added `CHROME_BIN` environment variable
- Improved Chrome path resolution

### 2. Enhanced Setup Script (`server/scripts/setup-render.sh`)
- Added retry logic for Chrome installation
- Better Chrome path detection
- Added Chrome testing
- More robust error handling

### 3. Improved Document Generation Service
- Better Chrome path resolution with glob pattern support
- Enhanced error logging
- More specific error messages

## Deployment Steps

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Fix Chrome installation for PDF generation on Render"
   git push
   ```

2. **Redeploy on Render:**
   - Go to your Render dashboard
   - Find your service
   - Click "Manual Deploy" or wait for auto-deploy

3. **Monitor the build logs:**
   - Look for Chrome installation messages
   - Verify the setup script runs successfully

4. **Test PDF downloads:**
   - Try downloading a report as PDF
   - If PDF still fails, try Word format as fallback

## Troubleshooting

If PDF generation still fails:

1. **Check Render logs** for Chrome-related errors
2. **Try Word format** - this doesn't require Chrome
3. **Contact Render support** if Chrome installation continues to fail

## Alternative Solutions

If Chrome continues to be problematic on Render:

1. **Use a different PDF library** (like jsPDF or PDFKit)
2. **Move to a different hosting platform** with better Chrome support
3. **Use an external PDF generation service**

The Word format download should work regardless of Chrome issues.