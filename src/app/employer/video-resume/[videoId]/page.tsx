import VideoReview from "./VideoReview";

export default async function EmployerVideoResumePage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  return <VideoReview videoId={videoId} />;
}
