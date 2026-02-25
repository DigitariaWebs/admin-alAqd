import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

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
 * Delete an image from Cloudinary by its public_id.
 */
export async function deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
}
