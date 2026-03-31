const FEMALE_PHOTO_BLUR_INTENSITY = 1200;

function normalizePhotos(photos?: string[]): string[] {
    if (!Array.isArray(photos)) return [];
    return photos.filter((photo): photo is string => typeof photo === 'string' && photo.length > 0);
}

function isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com') && url.includes('/upload/');
}

export function toBlurredPhotoUrl(url: string, blurIntensity = FEMALE_PHOTO_BLUR_INTENSITY): string {
    if (!url || !isCloudinaryUrl(url)) {
        return url;
    }

    if (url.includes('e_blur:')) {
        return url;
    }

    const uploadMarker = '/upload/';
    const markerIndex = url.indexOf(uploadMarker);

    if (markerIndex === -1) {
        return url;
    }

    const insertAt = markerIndex + uploadMarker.length;
    const transformation = `e_blur:${blurIntensity},q_auto,f_auto/`;

    return `${url.slice(0, insertAt)}${transformation}${url.slice(insertAt)}`;
}

export function getPhotosForViewer(options: {
  photos?: string[];
  targetGender?: string;
  blurEnabled?: boolean;
  isOwner: boolean;
  viewerId?: string;
  unblurredFor?: string[];
}): string[] {
  const photos = normalizePhotos(options.photos);
  const shouldBlur = shouldBlurPhotosForViewer(options);

  if (!shouldBlur) {
    return photos;
  }

  return photos.map((photo) => toBlurredPhotoUrl(photo));
}

export function shouldBlurPhotosForViewer(options: {
  targetGender?: string;
  blurEnabled?: boolean;
  isOwner: boolean;
  viewerId?: string;
  unblurredFor?: string[];
}): boolean {
  if (options.isOwner) return false;
  if (options.targetGender !== 'female') return false;
  if (options.blurEnabled === false) return false;

  // Check if viewer has been specifically unblurred
  if (options.viewerId && options.unblurredFor?.length) {
    const viewerStr = options.viewerId.toString();
    if (options.unblurredFor.some((id) => id.toString() === viewerStr)) {
      return false;
    }
  }

  return true;
}

export function getPrimaryPhotoForViewer(options: {
  photos?: string[];
  targetGender?: string;
  blurEnabled?: boolean;
  isOwner: boolean;
  viewerId?: string;
  unblurredFor?: string[];
}): string {
  return getPhotosForViewer(options)[0] ?? "";
}
