import { NextResponse } from 'next/server';
import { resolveLessonVideoRowAccess } from '@/lib/lessonAccess';
import { isLocalLessonVideo } from '@/lib/uploads';
import { parseYoutubeId, youtubeEmbedUrl } from '@/lib/video';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { videoId: string } },
) {
  const access = await resolveLessonVideoRowAccess(params.videoId);
  if (!access.ok) return access.response;

  const { url } = access.video;

  const youtubeId = parseYoutubeId(url);
  if (youtubeId) {
    return NextResponse.json({
      kind: 'youtube',
      videoId: youtubeId,
      embedUrl: youtubeEmbedUrl(youtubeId),
    });
  }

  if (isLocalLessonVideo(url)) {
    return NextResponse.json({
      kind: 'file',
      src: `/api/lessons/videos/${params.videoId}`,
    });
  }

  return NextResponse.json({ kind: 'external', src: url });
}
