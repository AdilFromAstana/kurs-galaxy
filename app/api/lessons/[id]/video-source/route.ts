import { NextResponse } from 'next/server';
import { resolveLessonVideoAccess } from '@/lib/lessonAccess';
import { isLocalLessonVideo } from '@/lib/uploads';
import { parseYoutubeId, youtubeEmbedUrl } from '@/lib/video';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const access = await resolveLessonVideoAccess(params.id);
  if (!access.ok) return access.response;

  const { videoUrl } = access.lesson;

  const youtubeId = parseYoutubeId(videoUrl);
  if (youtubeId) {
    return NextResponse.json({
      kind: 'youtube',
      videoId: youtubeId,
      embedUrl: youtubeEmbedUrl(youtubeId),
    });
  }

  if (isLocalLessonVideo(videoUrl)) {
    return NextResponse.json({
      kind: 'file',
      src: `/api/lessons/${params.id}/video`,
    });
  }

  return NextResponse.json({ kind: 'external', src: videoUrl });
}
