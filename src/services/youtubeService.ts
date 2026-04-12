/**
 * Service to check if a YouTube channel is live.
 * In a real production app, you would use the YouTube Data API v3.
 * For this demo, we provide a mock that can be easily replaced.
 */

export async function checkIsLive(channelId: string): Promise<boolean> {
  try {
    // This is a common trick to check live status without API key, 
    // but it might be blocked by CORS in the browser.
    // In a real app, you'd call a backend function or use the API.
    
    // For now, we return a mock value. 
    // You can change this to 'true' to test the live UI.
    return false; 
  } catch (error) {
    console.error("Error checking live status:", error);
    return false;
  }
}

export function getLiveStreamUrl(channelId: string) {
  return `https://www.youtube.com/embed/live_stream?channel=${channelId}`;
}
