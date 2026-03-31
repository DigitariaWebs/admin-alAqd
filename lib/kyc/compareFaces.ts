import {
  RekognitionClient,
  CompareFacesCommand,
  DetectTextCommand,
} from '@aws-sdk/client-rekognition';

export interface FaceComparisonResult {
  faceDetectedInSelfie: boolean;
  faceDetectedInId: boolean;
  faceMatch: boolean;
  faceScore: number; // 0–1 (1 = identical)
  nameMatch: boolean | null;
  dobMatch: boolean | null;
  extractedText: string; // combined text from front + back
  decision: 'verified' | 'manual_review' | 'rejected';
  reason: string;
}

const THRESHOLD_AUTO_VERIFY = 90;
const THRESHOLD_MANUAL_REVIEW = 70;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, '')    // remove special chars
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if the user's name appears in the extracted ID text.
 * The ID text may contain the name in uppercase, in Arabic, or split across lines.
 * We check each name part individually — if at least 2 parts match, it's a match.
 */
function checkNameInText(userName: string, extractedText: string): boolean {
  if (!userName || !extractedText) return false;

  const normalizedUser = normalizeName(userName);
  const normalizedText = normalizeName(extractedText);

  // Direct full match
  if (normalizedText.includes(normalizedUser)) return true;

  // Split name into parts and check each one
  const nameParts = normalizedUser.split(' ').filter(p => p.length >= 2);
  if (nameParts.length === 0) return false;

  const matchedParts = nameParts.filter(part => normalizedText.includes(part));

  // For short names (1-2 parts): all must match
  // For longer names (3+): at least 2 must match
  if (nameParts.length <= 2) {
    return matchedParts.length === nameParts.length;
  }
  return matchedParts.length >= 2;
}

/**
 * Check if the user's date of birth appears in the extracted ID text.
 * Handles many date formats: DD/MM/YYYY, YYYY.MM.DD, DD-MM-YYYY, DD.MM.YYYY, etc.
 * Also checks just the birth year as a fallback.
 */
function checkDobInText(dob: Date | string | undefined, extractedText: string): boolean {
  if (!dob || !extractedText) return false;

  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return false;

  const y = birthDate.getFullYear().toString();
  const m = String(birthDate.getMonth() + 1).padStart(2, '0');
  const d = String(birthDate.getDate()).padStart(2, '0');

  // Also check +1 day to handle UTC timezone shift (e.g., stored as Sept 17 UTC = Sept 18 local)
  const nextDay = new Date(birthDate.getTime() + 86400000);
  const ny = nextDay.getFullYear().toString();
  const nm = String(nextDay.getMonth() + 1).padStart(2, '0');
  const nd = String(nextDay.getDate()).padStart(2, '0');

  const formats = [
    // Original date
    `${d}/${m}/${y}`, `${d}-${m}-${y}`, `${d}.${m}.${y}`,
    `${y}/${m}/${d}`, `${y}-${m}-${d}`, `${y}.${m}.${d}`,
    `${m}/${d}/${y}`, `${m}-${d}-${y}`,
    // +1 day (timezone fix)
    `${nd}/${nm}/${ny}`, `${nd}-${nm}-${ny}`, `${nd}.${nm}.${ny}`,
    `${ny}/${nm}/${nd}`, `${ny}-${nm}-${nd}`, `${ny}.${nm}.${nd}`,
    `${nm}/${nd}/${ny}`, `${nm}-${nd}-${ny}`,
  ];

  for (const fmt of formats) {
    if (extractedText.includes(fmt)) return true;
  }

  // Fallback: at least the birth year
  if (extractedText.includes(y)) return true;

  return false;
}

async function extractTextFromImage(
  client: RekognitionClient,
  imageBytes: Buffer
): Promise<string> {
  const command = new DetectTextCommand({
    Image: { Bytes: imageBytes },
  });

  const response = await client.send(command);
  const detections = response.TextDetections ?? [];

  const lines = detections
    .filter(d => d.Type === 'LINE' && (d.Confidence ?? 0) > 70)
    .map(d => d.DetectedText ?? '')
    .filter(Boolean);

  return lines.join(' ');
}

/**
 * Compare a selfie with ID card photos (front + back) using AWS Rekognition.
 * Extracts text from both sides to verify name and DOB.
 */
export async function compareFaces(
  selfieUrl: string,
  idCardFrontUrl: string,
  idCardBackUrl: string,
  userName?: string,
  userDob?: Date | string
): Promise<FaceComparisonResult> {
  const region = process.env.AWS_REGION || 'eu-west-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.warn('[KYC] AWS credentials not configured, sending to manual review');
    return {
      faceDetectedInSelfie: true,
      faceDetectedInId: true,
      faceMatch: false,
      faceScore: 0,
      nameMatch: null,
      dobMatch: null,
      extractedText: '',
      decision: 'manual_review',
      reason: 'AWS Rekognition not configured — requires manual review',
    };
  }

  try {
    // Download all images
    const [selfieRes, frontRes, backRes] = await Promise.all([
      fetch(selfieUrl),
      fetch(idCardFrontUrl),
      fetch(idCardBackUrl),
    ]);

    if (!selfieRes.ok || !frontRes.ok || !backRes.ok) {
      return {
        faceDetectedInSelfie: false,
        faceDetectedInId: false,
        faceMatch: false,
        faceScore: 0,
        nameMatch: null,
        dobMatch: null,
        extractedText: '',
        decision: 'rejected',
        reason: 'Failed to download images',
      };
    }

    const selfieBuffer = Buffer.from(await selfieRes.arrayBuffer());
    const frontBuffer = Buffer.from(await frontRes.arrayBuffer());
    const backBuffer = Buffer.from(await backRes.arrayBuffer());

    const client = new RekognitionClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    // Run face comparison (selfie vs front) and OCR (front + back) in parallel
    const [compareResponse, frontText, backText] = await Promise.all([
      client.send(new CompareFacesCommand({
        SourceImage: { Bytes: selfieBuffer },
        TargetImage: { Bytes: frontBuffer },
        SimilarityThreshold: 50,
      })),
      extractTextFromImage(client, frontBuffer),
      extractTextFromImage(client, backBuffer),
    ]);

    const extractedText = `${frontText} ${backText}`.trim();
    console.log(`[KYC] Extracted text from ID (front+back): "${extractedText}"`);

    // Check name match
    let nameMatch: boolean | null = null;
    if (userName && extractedText) {
      nameMatch = checkNameInText(userName, extractedText);
      console.log(`[KYC] Name check: "${userName}" → ${nameMatch}`);
    }

    // Check DOB match
    let dobMatch: boolean | null = null;
    if (userDob && extractedText) {
      dobMatch = checkDobInText(userDob, extractedText);
      console.log(`[KYC] DOB check: "${userDob}" → ${dobMatch}`);
    }

    const sourceDetected = (compareResponse.SourceImageFace?.Confidence ?? 0) > 80;
    const faceMatches = compareResponse.FaceMatches ?? [];

    if (!sourceDetected) {
      return {
        faceDetectedInSelfie: false,
        faceDetectedInId: false,
        faceMatch: false,
        faceScore: 0,
        nameMatch,
        dobMatch,
        extractedText,
        decision: 'rejected',
        reason: 'No face detected in selfie',
      };
    }

    if (faceMatches.length === 0) {
      const unmatchedFaces = compareResponse.UnmatchedFaces ?? [];
      const idHasFace = unmatchedFaces.length > 0;

      return {
        faceDetectedInSelfie: true,
        faceDetectedInId: idHasFace,
        faceMatch: false,
        faceScore: 0,
        nameMatch,
        dobMatch,
        extractedText,
        decision: 'rejected',
        reason: idHasFace ? 'Faces do not match' : 'No face detected in ID card',
      };
    }

    const bestMatch = faceMatches[0];
    const similarity = bestMatch.Similarity ?? 0;
    const normalizedScore = similarity / 100;

    // All 3 checks must pass for auto-verify
    const allChecksPass = nameMatch !== false && dobMatch !== false;

    let decision: FaceComparisonResult['decision'];
    let reasons: string[] = [];

    reasons.push(`Face: ${similarity.toFixed(1)}%`);
    if (nameMatch === true) reasons.push('Name matches');
    if (nameMatch === false) reasons.push('Name NOT found on ID');
    if (dobMatch === true) reasons.push('DOB matches');
    if (dobMatch === false) reasons.push('DOB NOT found on ID');

    if (similarity >= THRESHOLD_AUTO_VERIFY && allChecksPass) {
      decision = 'verified';
    } else if (similarity >= THRESHOLD_AUTO_VERIFY && !allChecksPass) {
      decision = 'manual_review';
    } else if (similarity >= THRESHOLD_MANUAL_REVIEW) {
      decision = 'manual_review';
    } else {
      decision = 'rejected';
    }

    return {
      faceDetectedInSelfie: true,
      faceDetectedInId: true,
      faceMatch: similarity >= THRESHOLD_MANUAL_REVIEW,
      faceScore: normalizedScore,
      nameMatch,
      dobMatch,
      extractedText,
      decision,
      reason: reasons.join(' | '),
    };
  } catch (error: any) {
    console.error('[KYC] Rekognition error:', error.message);

    return {
      faceDetectedInSelfie: true,
      faceDetectedInId: true,
      faceMatch: false,
      faceScore: 0,
      nameMatch: null,
      dobMatch: null,
      extractedText: '',
      decision: 'manual_review',
      reason: `Rekognition error: ${error.message}`,
    };
  }
}
