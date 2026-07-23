import { useEffect, useRef } from "react";

export const AudioTrack = ({ track }) => {
  const audioRef = useRef();

  useEffect(() => {
    // Attach the Twilio track to our HTML audio element
    track.attach(audioRef.current);
    
    // Cleanup: Detach when the user mutes or leaves
    return () => {
      track.detach().forEach(element => element.remove());
    };
  }, [track]);

  return <audio ref={audioRef} autoPlay />;
};