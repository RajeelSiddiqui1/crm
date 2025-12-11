import { NextResponse } from 'next/server';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    
    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: 'File URL is required' },
        { status: 400 }
      );
    }

    // Extract public ID from Cloudinary URL
    let publicId = '';
    if (fileUrl.includes('cloudinary.com')) {
      const urlParts = fileUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1) {
        publicId = urlParts.slice(uploadIndex + 2).join('/').split('.')[0];
      }
    }

    if (!publicId) {
      // If not Cloudinary URL, redirect to original URL
      return NextResponse.redirect(fileUrl);
    }

    // Generate download URL with attachment flag
    const downloadUrl = cloudinary.url(publicId, {
      flags: 'attachment',
      secure: true,
      resource_type: 'auto'
    });

    return NextResponse.redirect(downloadUrl);

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}