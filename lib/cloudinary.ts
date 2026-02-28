import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// ============================================
// IMAGE UPLOAD
// ============================================

/**
 * Upload a base64-encoded image to Cloudinary.
 * Returns the secure_url and public_id.
 */
export async function uploadImage(
    dataUri: string,
    folder = 'al-aqd/profiles'
): Promise<{ url: string; publicId: string }> {
    const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
        transformation: [
            { width: 1080, height: 1080, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
        ],
    });
    return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Upload an image with custom transformation options
 */
export async function uploadImageAdvanced(
    dataUri: string,
    folder = 'al-aqd/profiles',
    options: {
        width?: number;
        height?: number;
        quality?: string;
        format?: string;
    } = {}
): Promise<{ url: string; publicId: string }> {
    const { width = 1080, height = 1080, quality = 'auto:good', format = 'auto' } = options;
    
    const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
        transformation: [
            { width, height, crop: 'limit', quality, fetch_format: format },
        ],
    });
    return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Compress/optimize an existing image by public_id
 */
export async function compressImage(
    publicId: string,
    options: {
        quality?: string;
        format?: string;
    } = {}
): Promise<{ url: string; publicId: string }> {
    const { quality = 'auto:good', format = 'auto' } = options;
    
    const result = await cloudinary.uploader.explicit(publicId, {
        type: 'upload',
        resource_type: 'image',
        transformation: [
            { quality, fetch_format: format },
        ],
    });
    return { url: result.secure_url, publicId: result.public_id };
}

// ============================================
// VIDEO UPLOAD
// ============================================

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export const VIDEO_CONFIG = {
    allowedMimeTypes: ALLOWED_VIDEO_TYPES,
    maxSizeBytes: MAX_VIDEO_SIZE_BYTES,
};

/**
 * Upload a video to Cloudinary.
 * Returns the secure_url and public_id.
 */
export async function uploadVideo(
    dataUri: string,
    folder = 'al-aqd/videos'
): Promise<{ url: string; publicId: string }> {
    const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'video',
        transformation: [
            { quality: 'auto', fetch_format: 'auto' },
        ],
        eager: [
            { streaming_profile: 'hd', format: 'm3u8' },
        ],
    });
    return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Upload a video with thumbnail generation
 */
export async function uploadVideoWithThumbnail(
    dataUri: string,
    folder = 'al-aqd/videos'
): Promise<{ url: string; publicId: string; thumbnailUrl: string }> {
    const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'video',
        transformation: [
            { quality: 'auto', fetch_format: 'auto' },
        ],
        eager: [
            { streaming_profile: 'hd', format: 'm3u8' },
            { format: 'jpg', start_offset: '0' },
        ],
    });
    
    // Get thumbnail from eager transformations
    const thumbnailUrl = result.eager?.[1]?.secure_url || '';
    
    return { url: result.secure_url, publicId: result.public_id, thumbnailUrl };
}

// ============================================
// DOCUMENT UPLOAD
// ============================================

const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/rtf',
];
const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const DOCUMENT_CONFIG = {
    allowedMimeTypes: ALLOWED_DOCUMENT_TYPES,
    maxSizeBytes: MAX_DOCUMENT_SIZE_BYTES,
};

/**
 * Upload a document to Cloudinary.
 * Returns the secure_url and public_id.
 */
export async function uploadDocument(
    dataUri: string,
    folder = 'al-aqd/documents'
): Promise<{ url: string; publicId: string }> {
    const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'raw',
    });
    return { url: result.secure_url, publicId: result.public_id };
}

// ============================================
// DELETE FILES
// ============================================

/**
 * Delete any file from Cloudinary by its public_id.
 * Works for images, videos, and raw files.
 */
export async function deleteFile(publicId: string): Promise<boolean> {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
}

/**
 * Delete an image from Cloudinary (alias for backward compatibility)
 */
export async function deleteImage(publicId: string): Promise<boolean> {
    return deleteFile(publicId);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get the URL for a file without downloading it
 */
export function getMediaUrl(publicId: string, options?: {
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    format?: string;
    width?: number;
    height?: number;
}): string {
    const opts = options || {};
    const resourceType = opts.resourceType || 'auto';
    const format = opts.format;
    const width = opts.width;
    const height = opts.height;
    
    const transformations: string[] = [];
    
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (format) transformations.push(`f_${format}`);
    
    const transformationStr = transformations.length > 0 ? transformations.join(',') + '/' : '';
    
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${transformationStr}${publicId}`;
}

/**
 * Generate a signed URL for secure access
 */
export function getSignedUrl(publicId: string, options?: {
    expiresIn?: number;
    resourceType?: 'image' | 'video' | 'raw';
}): string {
    const opts = options || {};
    const expiresIn = opts.expiresIn || 3600;
    const resourceType = opts.resourceType || 'image';
    
    const timestamp = Math.round(Date.now() / 1000) + expiresIn;
    
    const signature = cloudinary.utils.api_sign_request(
        {
            public_id: publicId,
            timestamp,
        },
        process.env.CLOUDINARY_API_SECRET!
    );
    
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/v${timestamp}/${publicId}?signature=${signature}&api_key=${process.env.CLOUDINARY_API_KEY}`;
}
